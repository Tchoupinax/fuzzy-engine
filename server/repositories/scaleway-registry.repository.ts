import type { AxiosError } from "axios";

import { Option } from "@swan-io/boxed";
import axios from "axios";
import prettyBytes from "pretty-bytes";

import type { Provider } from "../../types/provider";
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
  status: "ready" | string; // assuming 'ready' is one of many possible statuses
  status_message: string;
  visibility: "inherit" | string; // assuming 'inherit' is one of many possible visibility options
  size: number;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
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

// https://www.scaleway.com/en/developers/api/registry/
export class ScalewayRegistryRepository implements RegistryApiRepository {
  public name: Provider = "scaleway-registry";

  constructor(private config: ScalewayRegistryRepositoryConfig) {}

  async listRepositories(
    limit: number,
    offset: number,
    name: Option<string>,
  ): Promise<Array<ContainerRepository>> {
    const repositories = await this.internalListRepositories(
      limit,
      offset,
      name,
    );

    const repos = await Promise.all(
      repositories.map((repository) => {
        // Wait because of 429 (five requests).... LOL SCALEWAY!!
        // await new Promise((r) => setTimeout(r, 1000));

        return this.internalListRepositoryTagsCount(repository).then(
          (tagsCount) => {
            return {
              name: repository.name,
              countOfTags: tagsCount,
              url: this.config.url,
            } satisfies ContainerRepository;
          },
        );
      }),
    );

    return repos;
  }

  private async internalListRepositoryTagsCount(
    repo: ScalewayImage,
  ): Promise<number> {
    const answer = await axios({
      url: `${this.getComputedUrl()}/images/${repo.id}/tags`,
      headers: {
        "X-Auth-Token": `${this.config.token}`,
      },
    });

    return answer.data.total_count;
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

    const { data } = await axios({
      url: `${this.getComputedUrl()}/images/${repo.id}/tags`,
      headers: {
        "X-Auth-Token": `${this.config.token}`,
      },
    });

    return {
      name: repositoryName,
      noTag: true,
      digests: (data.tags as Array<ScalewayImageTag>)
        .map(
          (d, index) =>
            ({
              architectures: [],
              created: d.updated_at as Date,
              fullDigest: "fe",
              name: d.digest.replace("sha256:", "").slice(7, 19),
              size: index === 0 ? prettyBytes(repo.size) : prettyBytes(0),
              tags: [d.name],
            }) satisfies ContainerRepositoryTags,
        )
        .sort((a, b) => {
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

  private getComputedUrl() {
    return `https://api.scaleway.com/registry/v1/regions/fr-par`;
  }

  private async internalListRepositories(
    limit: number,
    offset: number,
    name: Option<string>,
  ): Promise<Array<ScalewayImage>> {
    let answer;

    const params = new URLSearchParams();
    params.append("page_size", limit.toString());
    params.append("page", (offset / 10).toString());
    params.append("order_by", "name_asc");

    console.log(`${this.getComputedUrl()}/images?${params.toString()}`);
    try {
      answer = await axios({
        method: "GET",
        url: `${this.getComputedUrl()}/images?${params.toString()}`,
        headers: {
          "X-Auth-Token": `${this.config.token}`,
        },
      });
    } catch (err) {
      logger.error((err as AxiosError).response?.data);
      throw err;
    }

    return answer.data.images;
  }
}
