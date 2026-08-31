import type { AxiosError, AxiosResponse } from "axios";

import { Option } from "@swan-io/boxed";
import axios from "axios";
import prettyBytes from "pretty-bytes";

import type { Provider } from "../../types/provider";
import type { listLatest10TagsResult } from "../domain/list-latest-tags.use-case";
import type {
  CleanupNonSemverTagsResult,
  ContainerRepository,
  ContainerRepositoryTags,
  listRepositoriesTagsAnswer,
  RegistryApiRepository,
} from "../gateways/registry-api.gateway";

import { isSemverTag } from "../tools/is-semver-tag";
import { logger } from "../tools/logger";

export type ScalewayRegistryRepositoryConfig = {
  url: string;
  token: string;
};
export type DockerRegistryRepositoryName = string;

type ScalewayImage = {
  id: string;
  name: string;
  namespace_id: string;
  status: "ready" | string;
  status_message: string;
  visibility: "inherit" | string;
  size: number;
  created_at: string;
  updated_at: string;
  tags: string[];
};

type ScalewayImageTag = {
  id: string;
  name: string;
  image_id: string;
  status: "ready" | "pending" | "failed";
  digest: string;
  created_at: string;
  updated_at: string;
};

const REGISTRY_V2_MANIFEST_ACCEPT =
  "application/vnd.docker.distribution.manifest.v2+json, application/vnd.docker.distribution.manifest.list.v2+json";

const registryBearerTokenCache = new Map<
  string,
  { expiresAt: number; value: string }
>();

type RegistryBearerChallenge = {
  realm: string;
  service: string;
  scope?: string;
};

function parseRegistryBearerChallenge(
  wwwAuthenticate: string | undefined,
): RegistryBearerChallenge | null {
  if (!wwwAuthenticate?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const params: Record<string, string> = {};
  for (const match of wwwAuthenticate.slice(7).matchAll(/(\w+)="([^"]*)"/g)) {
    params[match[1]!] = match[2]!;
  }

  if (!params.realm || !params.service) {
    return null;
  }

  return {
    realm: params.realm,
    scope: params.scope,
    service: params.service,
  };
}

const SCALEWAY_REQUEST_DELAY_MS = 250;
const SCALEWAY_MAX_RETRIES = 4;
const SCALEWAY_MAX_CONCURRENT_REQUESTS = 4;
const SCALEWAY_REPOSITORIES_CACHE_TTL_MS = 300_000;

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const repositoriesCache = new Map<
  string,
  CacheEntry<Array<ContainerRepository>>
>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mapWithConcurrency<T, R>(
  items: Array<T>,
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<Array<R>> {
  if (items.length === 0) {
    return [];
  }

  const results = new Array<R>(items.length);
  let currentIndex = 0;

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (currentIndex < items.length) {
        const index = currentIndex++;
        const item = items[index];
        if (item === undefined) {
          continue;
        }
        results[index] = await mapper(item, index);
      }
    },
  );

  await Promise.all(workers);
  return results;
}

// https://www.scaleway.com/en/developers/api/registry/
export class ScalewayRegistryRepository implements RegistryApiRepository {
  public name: Provider = "scaleway-registry";

  constructor(private config: ScalewayRegistryRepositoryConfig) {}

  async listRepositories(
    limit: number,
    offset: number,
    name: Option<string>,
  ): Promise<Array<ContainerRepository>> {
    logger.info(
      { limit, offset, hasNameFilter: name.isSome() },
      "Scaleway: listing repositories",
    );

    if (name.isNone() && offset === 0) {
      const cached = this.getCachedRepositories();
      if (cached) {
        logger.info(
          { count: cached.length },
          "Scaleway: returning cached repositories",
        );
        return cached;
      }
    }

    const repositories = await this.internalListRepositories(
      limit,
      offset,
      name,
    );

    const startedAt = Date.now();
    logger.info(
      { count: repositories.length },
      "Scaleway: resolving tag counts",
    );

    const repos = await mapWithConcurrency(
      repositories,
      SCALEWAY_MAX_CONCURRENT_REQUESTS,
      async (repository, index) => {
        const countOfTags = await this.getRepositoryTagsCount(repository);

        logger.debug(
          {
            progress: `${index + 1}/${repositories.length}`,
            image: repository.name,
            countOfTags,
            sizeBytes: repository.size,
          },
          "Scaleway: repository metadata resolved",
        );

        return {
          name: repository.name,
          countOfTags,
          size: prettyBytes(repository.size),
          url: this.config.url,
        };
      },
    );

    logger.info(
      {
        count: repos.length,
        durationMs: Date.now() - startedAt,
      },
      "Scaleway: repositories listed",
    );

    if (name.isNone() && offset === 0) {
      this.setCachedRepositories(repos);
    }

    return repos;
  }

  async listLatestTags(): Promise<Array<listLatest10TagsResult>> {
    const startedAt = Date.now();
    logger.info("Scaleway: starting listLatestTags");

    const images = await this.listAllImages();
    logger.info(
      { totalImages: images.length, withTags: images.filter((i) => i.tags.length > 0).length },
      "Scaleway: all images fetched",
    );

    const candidates = images
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      .slice(0, 40);

    logger.info(
      {
        candidateCount: candidates.length,
        topCandidates: candidates.slice(0, 5).map((image) => ({
          name: image.name,
          updatedAt: image.updated_at,
          tagCount: image.tags.length,
        })),
      },
      "Scaleway: candidate images selected for tag lookup",
    );

    const latestTags = await mapWithConcurrency(
      candidates,
      SCALEWAY_MAX_CONCURRENT_REQUESTS,
      async (image, index) => {
        logger.debug(
          {
            progress: `${index + 1}/${candidates.length}`,
            image: image.name,
            updatedAt: image.updated_at,
          },
          "Scaleway: fetching latest tag for image",
        );

        const tag = await this.getLatestTagForImage(image);
        if (tag) {
          logger.debug(
            {
              progress: `${index + 1}/${candidates.length}`,
              image: tag.name,
              tag: tag.tag,
              createdAt: tag.createdAt.toISOString(),
            },
            "Scaleway: latest tag resolved",
          );
        } else {
          logger.warn(
            {
              progress: `${index + 1}/${candidates.length}`,
              image: image.name,
            },
            "Scaleway: no tag found for image",
          );
        }

        return tag;
      },
    );

    const result = latestTags
      .filter((tag): tag is listLatest10TagsResult => tag !== null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    logger.info(
      {
        durationMs: Date.now() - startedAt,
        resultCount: result.length,
        results: result.map((item) => ({
          name: item.name,
          tag: item.tag,
          createdAt: item.createdAt.toISOString(),
        })),
      },
      "Scaleway: listLatestTags completed",
    );

    return result;
  }

  async listRepositoriesTags(
    repositoryName: string,
  ): Promise<listRepositoriesTagsAnswer> {
    const repositories = await this.internalListRepositories(
      100,
      0,
      Option.Some(repositoryName),
    );

    const repo: ScalewayImage | undefined = repositories
      .filter((e) => e.name === repositoryName)
      .at(0);

    if (!repo) {
      throw new Error("repo not found for scaleway");
    }

    const tags = await this.listAllTagsForImage(repo.id);

    if (tags.length === 0) {
      return {
        name: repositoryName,
        noTag: true,
        digests: [],
      };
    }

    const digestGroups = new Map<
      string,
      { created: Date; digest: string; tags: Array<string> }
    >();

    for (const tag of tags) {
      const created = new Date(tag.created_at ?? tag.updated_at);
      const existing = digestGroups.get(tag.digest);

      if (existing) {
        existing.tags.push(tag.name);
        if (created > existing.created) {
          existing.created = created;
        }
        continue;
      }

      digestGroups.set(tag.digest, {
        created,
        digest: tag.digest,
        tags: [tag.name],
      });
    }

    const digests = await mapWithConcurrency(
      Array.from(digestGroups.values()),
      SCALEWAY_MAX_CONCURRENT_REQUESTS,
      async (group) => {
        const sizeBytes = await this.getManifestSizeBytes(
          repositoryName,
          group.digest,
          group.tags[0],
        );

        return {
          architectures: [],
          created: group.created,
          fullDigest: group.digest.replace("sha256:", ""),
          name: group.digest.slice(7, 19),
          size: prettyBytes(sizeBytes > 0 ? sizeBytes : repo.size),
          tags: group.tags,
        } satisfies ContainerRepositoryTags;
      },
    );

    return {
      name: repositoryName,
      noTag: false,
      digests: digests.sort((a, b) => {
        if (a.created < b.created) {
          return 1;
        }
        if (a.created > b.created) {
          return -1;
        }
        return 0;
      }),
    };
  }

  async cleanupNonSemverTagsOlderThan(
    olderThanMs: number,
  ): Promise<CleanupNonSemverTagsResult> {
    const cutoff = Date.now() - olderThanMs;
    const images = await this.listAllImages();
    let scanned = 0;
    let deleted = 0;
    const failed: CleanupNonSemverTagsResult["failed"] = [];

    for (const image of images) {
      const tags = await this.listAllTagsForImage(image.id);

      for (const tag of tags) {
        scanned++;

        if (isSemverTag(tag.name)) {
          continue;
        }

        const createdAt = new Date(tag.created_at ?? tag.updated_at).getTime();
        if (!Number.isFinite(createdAt) || createdAt > cutoff) {
          continue;
        }

        try {
          await this.deleteTag(tag.id);
          deleted++;
          logger.info(
            { image: image.name, tag: tag.name },
            "Scaleway: deleted non-semver tag",
          );
        } catch (err) {
          const axiosError = err as AxiosError;
          const reason =
            typeof axiosError.response?.data === "object"
              ? JSON.stringify(axiosError.response.data)
              : String(axiosError.response?.data ?? axiosError.message);

          failed.push({
            image: image.name,
            reason,
            tag: tag.name,
          });
          logger.warn(
            { error: axiosError.response?.data, image: image.name, tag: tag.name },
            "Scaleway: failed to delete tag",
          );
        }

        await sleep(SCALEWAY_REQUEST_DELAY_MS);
      }
    }

    return { deleted, failed, scanned };
  }

  private getCacheKey(): string {
    return `${this.config.url}:${this.config.token}:v5`;
  }

  private getCachedRepositories(): Array<ContainerRepository> | null {
    const cached = repositoriesCache.get(this.getCacheKey());
    if (!cached || cached.expiresAt <= Date.now()) {
      return null;
    }

    return cached.value;
  }

  private setCachedRepositories(repos: Array<ContainerRepository>): void {
    repositoriesCache.set(this.getCacheKey(), {
      expiresAt: Date.now() + SCALEWAY_REPOSITORIES_CACHE_TTL_MS,
      value: repos,
    });
  }

  private getComputedUrl() {
    return `https://api.scaleway.com/registry/v1/regions/fr-par`;
  }

  private getRegistryV2ManifestUrl(
    repositoryName: string,
    reference: string,
  ): string {
    const normalized = this.config.url
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    const slashIndex = normalized.indexOf("/");

    const host =
      slashIndex === -1 ? normalized : normalized.slice(0, slashIndex);
    const namespace =
      slashIndex === -1 ? "" : normalized.slice(slashIndex + 1);

    const fullRepositoryName = namespace
      ? `${namespace}/${repositoryName}`
      : repositoryName;

    return `https://${host}/v2/${fullRepositoryName}/manifests/${reference}`;
  }

  private async getRegistryV2BearerToken(
    challenge: RegistryBearerChallenge,
  ): Promise<string> {
    const cacheKey = `${this.config.url}:${challenge.service}:${challenge.scope ?? ""}`;
    const cached = registryBearerTokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const { data } = await axios.get<{
      access_token?: string;
      expires_in?: number;
      token?: string;
    }>(challenge.realm, {
      auth: {
        password: this.config.token,
        username: "nologin",
      },
      params: {
        service: challenge.service,
        ...(challenge.scope ? { scope: challenge.scope } : {}),
      },
    });

    const token = data.token ?? data.access_token;
    if (!token) {
      throw new Error("Scaleway registry token response missing token");
    }

    const expiresIn = Math.max(Number(data.expires_in ?? 60), 60);
    registryBearerTokenCache.set(cacheKey, {
      expiresAt: Date.now() + expiresIn * 1000 - 10_000,
      value: token,
    });

    return token;
  }

  private async registryV2Get(url: string): Promise<{
    data: unknown;
    status: number;
  }> {
    const response = await axios({
      auth: {
        password: this.config.token,
        username: "nologin",
      },
      headers: {
        Accept: REGISTRY_V2_MANIFEST_ACCEPT,
      },
      method: "GET",
      url,
      validateStatus: () => true,
    });

    if (response.status !== 401) {
      return response;
    }

    const challenge = parseRegistryBearerChallenge(
      response.headers["www-authenticate"] as string | undefined,
    );

    if (!challenge) {
      return response;
    }

    const token = await this.getRegistryV2BearerToken(challenge);

    return axios({
      headers: {
        Accept: REGISTRY_V2_MANIFEST_ACCEPT,
        Authorization: `Bearer ${token}`,
      },
      method: "GET",
      url,
      validateStatus: () => true,
    });
  }

  private async getManifestSizeBytes(
    repositoryName: string,
    reference: string,
    fallbackReference?: string,
  ): Promise<number> {
    const references = [reference];
    if (fallbackReference && fallbackReference !== reference) {
      references.push(fallbackReference);
    }

    for (const manifestReference of references) {
      const size = await this.fetchManifestSizeBytes(
        repositoryName,
        this.getRegistryV2ManifestUrl(repositoryName, manifestReference),
      );

      if (size > 0) {
        return size;
      }
    }

    return 0;
  }

  private async fetchManifestSizeBytes(
    repositoryName: string,
    manifestUrl: string,
  ): Promise<number> {
    for (let attempt = 0; attempt <= SCALEWAY_MAX_RETRIES; attempt++) {
      const response = await this.registryV2Get(manifestUrl);

      if (response.status === 429 && attempt < SCALEWAY_MAX_RETRIES) {
        await sleep(SCALEWAY_REQUEST_DELAY_MS * 2 ** attempt);
        continue;
      }

      if (response.status >= 400) {
        return 0;
      }

      const data = response.data as {
        layers?: Array<{ size: number }>;
        manifests?: Array<{ digest: string }>;
      };

      if (data.manifests && data.manifests.length > 0) {
        const sizes = await mapWithConcurrency(
          data.manifests,
          SCALEWAY_MAX_CONCURRENT_REQUESTS,
          async (manifest) =>
            this.getManifestSizeBytes(repositoryName, manifest.digest),
        );

        return sizes.reduce((sum, size) => sum + size, 0);
      }

      if (data.layers) {
        return data.layers.reduce((sum, layer) => sum + layer.size, 0);
      }

      return 0;
    }

    return 0;
  }

  private async deleteTag(tagId: string): Promise<void> {
    await axios({
      headers: {
        "X-Auth-Token": `${this.config.token}`,
      },
      method: "DELETE",
      url: `${this.getComputedUrl()}/tags/${tagId}`,
    });
  }

  private async listAllTagsForImage(
    imageId: string,
  ): Promise<Array<ScalewayImageTag>> {
    const tags: Array<ScalewayImageTag> = [];
    let page = 0;

    while (true) {
      const params = new URLSearchParams();
      params.append("page_size", "100");
      params.append("page", page.toString());

      const { data } = await this.scalewayRequest(
        `${this.getComputedUrl()}/images/${imageId}/tags?${params.toString()}`,
      );

      const batch = data.tags as Array<ScalewayImageTag>;
      tags.push(...batch);

      if (batch.length < 100) {
        break;
      }

      page++;
      await sleep(SCALEWAY_REQUEST_DELAY_MS);
    }

    return tags;
  }

  private async scalewayRequest(url: string): Promise<AxiosResponse> {
    for (let attempt = 0; attempt <= SCALEWAY_MAX_RETRIES; attempt++) {
      try {
        logger.debug({ url, attempt }, "Scaleway: API request");
        const response = await axios({
          method: "GET",
          url,
          headers: {
            "X-Auth-Token": `${this.config.token}`,
          },
        });
        logger.debug(
          { url, status: response.status },
          "Scaleway: API request succeeded",
        );
        return response;
      } catch (err) {
        const axiosError = err as AxiosError;
        const status = axiosError.response?.status;

        if (status === 429 && attempt < SCALEWAY_MAX_RETRIES) {
          const delay = SCALEWAY_REQUEST_DELAY_MS * 2 ** attempt;
          logger.warn(
            { url, attempt, delay },
            "Scaleway rate limit hit, retrying",
          );
          await sleep(delay);
          continue;
        }

        logger.error(axiosError.response?.data);
        throw err;
      }
    }

    throw new Error("Scaleway request failed after retries");
  }

  private async getRepositoryTagsCount(image: ScalewayImage): Promise<number> {
    const params = new URLSearchParams();
    params.append("page_size", "1");
    params.append("page", "0");

    const answer = await this.scalewayRequest(
      `${this.getComputedUrl()}/images/${image.id}/tags?${params.toString()}`,
    );

    return answer.data.total_count ?? 0;
  }

  private async listAllImages(): Promise<Array<ScalewayImage>> {
    const images: Array<ScalewayImage> = [];
    let page = 0;

    logger.info("Scaleway: fetching all images");

    while (true) {
      const params = new URLSearchParams();
      params.append("page_size", "100");
      params.append("page", page.toString());
      params.append("order_by", "name_asc");

      const answer = await this.scalewayRequest(
        `${this.getComputedUrl()}/images?${params.toString()}`,
      );

      const batch = answer.data.images as Array<ScalewayImage>;
      images.push(...batch);

      logger.info(
        {
          page,
          pageSize: batch.length,
          totalSoFar: images.length,
        },
        "Scaleway: images page fetched",
      );

      if (batch.length < 100) {
        break;
      }

      page++;
      await sleep(SCALEWAY_REQUEST_DELAY_MS);
    }

    return images;
  }

  private async getLatestTagForImage(
    image: ScalewayImage,
  ): Promise<listLatest10TagsResult | null> {
    const params = new URLSearchParams();
    params.append("page_size", "1");
    params.append("page", "0");
    params.append("order_by", "created_at_desc");

    const { data } = await this.scalewayRequest(
      `${this.getComputedUrl()}/images/${image.id}/tags?${params.toString()}`,
    );

    const latestTag = (data.tags as Array<ScalewayImageTag>).at(0);
    if (!latestTag) {
      return null;
    }

    return {
      createdAt: new Date(latestTag.created_at),
      name: image.name,
      tag: latestTag.name,
      size: prettyBytes(image.size),
    };
  }

  private async internalListRepositories(
    limit: number,
    offset: number,
    name: Option<string>,
  ): Promise<Array<ScalewayImage>> {
    const params = new URLSearchParams();
    params.append("page_size", limit.toString());
    params.append("page", (offset / 10).toString());
    params.append("order_by", "name_asc");

    const answer = await this.scalewayRequest(
      `${this.getComputedUrl()}/images?${params.toString()}`,
    );

    const images = answer.data.images as Array<ScalewayImage>;

    if (name.isSome()) {
      return images.filter((image) => image.name.match(name.value));
    }

    return images;
  }
}
