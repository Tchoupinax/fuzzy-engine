import axios from "axios";
import prettyBytes from "pretty-bytes";

import type { Provider } from "../../types/provider";
import type {
  RegistryApiRepository,
  ContainerRepository,
  listRepositoriesTagsAnswer,
} from "../gateways/registry-api.gateway";

import { logger } from "../tools/logger";

export type DockerhubRepositoryConfig = { username: string; password: string };
export type DockerhubImage = {
  affiliation: string;
  content_types: Array<string>;
  date_registered: string;
  description: string;
  is_private: boolean;
  last_updated: string;
  media_types: Array<string>;
  name: string;
  namespace: string;
  pull_count: number;
  repository_type: string;
  star_count: number;
  status: number;
  status_description: string;
};
export type DockerhubTagImage = {
  architecture: string;
  features: string;
  variant: string;
  digest: string;
  os: string;
  os_features: string;
  os_version: string;
  size: number;
  status: string;
  last_pulled: string;
  last_pushed: string;
};
export type DockerhubTag = {
  content_type: string;
  creator: number;
  digest: string;
  full_size: number;
  id: number;
  images: DockerhubTagImage[];
  last_updated: string;
  last_updater: number;
  last_updater_username: string;
  media_type: string;
  name: string;
  repository: number;
  tag_last_pulled: string;
  tag_last_pushed: string;
  tag_status: string;
  v2: boolean;
};

export class DockerhubRepository implements RegistryApiRepository {
  private url: string;
  private token: string | undefined;
  public name: Provider | undefined;

  constructor(private config: DockerhubRepositoryConfig) {
    this.url = "https://hub.docker.com/v2";
  }

  async listRepositories(): Promise<Array<ContainerRepository>> {
    logger.info("DockerhubRepository.listRepositories");

    const repositories = await this.internalListRepositories();

    return Promise.all(
      repositories.map((repository) => {
        return this.internalListRepositoryTags(repository.name).then((tags) => {
          return {
            name: repository.name,
            countOfTags: tags.length,
            url: "",
          };
        });
      }),
    );
  }

  async listRepositoriesTags(
    repositoryName: string,
  ): Promise<listRepositoriesTagsAnswer> {
    logger.info("DockerhubRepository.listRepositoriesTags");

    const tags: DockerhubTag[] =
      await this.internalListRepositoryTags(repositoryName);

    if (tags.length === 0) {
      return {
        noTag: true,
        name: repositoryName,
        digests: [],
      };
    }

    const tagsWithDigest = tags.map((tag) => {
      return {
        architectures: tag.images.map((image) => image.architecture),
        created: tag.tag_last_pushed,
        digest: tag.images[0].digest.replace("sha256:", "").slice(7, 19),
        fullDigest: tag.images[0].digest.slice(8),
        name: tag.name,
        size: prettyBytes(tag.full_size),
      };
    });

    const finalDigests = new Map();
    tagsWithDigest.forEach(
      ({ name, digest, size, created, fullDigest, architectures }) => {
        if (finalDigests.has(digest)) {
          finalDigests.set(digest, {
            name: digest,
            tags: [...finalDigests.get(digest).tags, name],
            size,
            created,
            fullDigest,
            architectures,
          });
        } else {
          finalDigests.set(digest, {
            name: digest,
            tags: [name],
            size,
            created,
            fullDigest,
            architectures,
          });
        }
      },
    );

    return {
      noTag: false,
      name: repositoryName,
      digests: Array.from(finalDigests.values()).sort((a, b) => {
        if (a.created > b.created) {
          return -1;
        } else if (a.created < b.created) {
          return 1;
        } else {
          return 0;
        }
      }),
    };
  }

  private async getArchitecture(name: string, tag: string) {
    const { data } = await axios({
      method: "GET",
      url: `${this.url}/v2/${name}/manifests/${tag}`,
      headers: {
        Accept: "application/vnd.docker.distribution.manifest.list.v2+json", // Manifest list, aka “fat manifest”
      },
    });

    if (!data.manifests) {
      return [data.architecture];
    }

    return data.manifests.map((m: any) => {
      return `${m.platform.os}/${m.platform.architecture}${
        m.platform.variant ?? ""
      }`;
    });
  }

  private async getToken(): Promise<string> {
    if (this.token) {
      return Promise.resolve(this.token);
    }

    const { data } = await axios({
      method: "POST",
      url: `${this.url}/users/login`,
      data: {
        username: this.config.username,
        password: this.config.password,
      },
    });

    this.token = data.token;
    return data.token;
  }

  private async internalListRepositories(): Promise<Array<DockerhubImage>> {
    const answer = await axios({
      method: "GET",
      url: `${this.url}/repositories/${this.config.username}/?page_size=25&page=1`,
      headers: {
        Authorization: `JWT ${await this.getToken()}`,
      },
    });

    return answer.data.results;
  }

  private async internalListRepositoryTags(
    repositoryName: string,
  ): Promise<Array<DockerhubTag>> {
    const answer = await axios({
      method: "GET",
      url: `${this.url}/repositories/${this.config.username}/${repositoryName}/tags/?page_size=25&page=1`,
      headers: {
        Authorization: `JWT ${await this.getToken()}`,
      },
    });

    return answer.data.results;
  }
}
