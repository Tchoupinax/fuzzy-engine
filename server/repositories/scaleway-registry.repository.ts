import type { AxiosError, AxiosResponse } from "axios";

import { Option } from "@swan-io/boxed";
import axios from "axios";
import prettyBytes from "pretty-bytes";

import type { Provider } from "../../types/provider";
import type { listLatest10TagsResult } from "../domain/list-latest-tags.use-case";
import type {
  ContainerRepository,
  ContainerRepositoryTags,
  listRepositoriesTagsAnswer,
  RegistryApiRepository,
} from "../gateways/registry-api.gateway";

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
  created_at: Date;
  updated_at: Date;
};

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
      const created = new Date(tag.updated_at);
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

    const digests = Array.from(digestGroups.values()).map((group) => ({
      architectures: [],
      created: group.created,
      fullDigest: group.digest.replace("sha256:", ""),
      name: group.digest.slice(7, 19),
      size: prettyBytes(repo.size),
      tags: group.tags,
    } satisfies ContainerRepositoryTags));

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
