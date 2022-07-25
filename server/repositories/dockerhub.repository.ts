import { listRepositoriesTagsAnswer, RegistryApiRepository } from "../gateways/registry-api.gateway";
import axios from 'axios';
import prettyBytes from "pretty-bytes";

export type DockerhubRepositoryConfig = { username: string, password: string };

export type DockerhubTag = {
  creator: number;
  id: number;
  images: DockerhubImage[];
  last_updated: Date;
  last_updater: number;
  last_updater_username: string;
  name: string;
  repository: number;
  full_size: number;
  v2: boolean;
  tag_status: string;
  tag_last_pulled: null;
  tag_last_pushed: Date;
}

type DockerhubImage = {
  architecture: string;
  features: string;
  variant: null;
  digest: string;
  os: string;
  os_features: string;
  os_version: null;
  size: number;
  status: string;
  last_pulled: null;
  last_pushed: null;
}

export class DockerhubRepository implements RegistryApiRepository {
  private url: string;

  constructor(private config: DockerhubRepositoryConfig) {
    this.url = "https://hub.docker.com/v2";
  }

  async listRepositories(): Promise<any[]> {
    let repositories: Array<any>;

    const token = await this.getToken();

    try {
      ({
        data: { results: repositories },
      } = await axios({
        method: 'GET',
        url: `${this.url}/repositories/${this.config.username}/?page_size=25&page=1&ordering=last_updated`,
        headers: {
          Authorization: `JWT ${token}`,
        }
      }));
    } catch (err) {
      console.log(err.message)
      return [];
    };

    repositories = await Promise.all(repositories.map(async (repository) => {
      return axios({
        method: 'GET',
        url: `${this.url}/repositories/${this.config.username}/${repository.name}/tags/?page_size=25&page=1&ordering=last_updated`,
        headers: {
          Authorization: `JWT ${token}`,
        }
      })
        .then(({
          data,
        }) => {
          return {
            name: repository.name,
            countOfTags: Array.isArray(data.results) ? data.results.length : 0,
          };
        })
        .catch((err) => {
          return null;
        });
    }));

    // Remove empty repository from the list
    return repositories.filter(r => r).filter(r => r.countOfTags > 0);
  }

  async listRepositoriesTags(repositoryName: string): Promise<listRepositoriesTagsAnswer> {
    const { data } = await axios({
      method: 'GET',
      url: `${this.url}/repositories/${this.config.username}/${repositoryName}/tags/?page_size=25&page=1&ordering=last_updated`,
      headers: {
        Authorization: `JWT ${await this.getToken()}`,
      }
    });

    const tags: DockerhubTag[] = data.results;

    if (tags.length === 0) {
      return {
        noTag: true,
        name: repositoryName,
        digests: [],
      };
    }

    const tagsWithDigest = tags.map(tag => {
      return {
        name: tag.name,
        digest: tag.images[0].digest.replace('sha256:', '').slice(7, 19),
        fullDigest: tag.images[0].digest.slice(8),
        size: prettyBytes(tag.full_size),
        created: tag.tag_last_pushed,
        architecures: tag.images.map(image => image.architecture),
      };
    })

    const finalDigests = new Map();
    tagsWithDigest.forEach(({ name, digest, size, created, fullDigest, architecures }) => {
      if (finalDigests.has(digest)) {
        finalDigests.set(digest, {
          name: digest,
          tags: [...finalDigests.get(digest).tags, name],
          size,
          created,
          fullDigest,
          architecures,
        });
      } else {
        finalDigests.set(digest, { name: digest, tags: [name], size, created, fullDigest, architecures });
      }
    });

    return {
      noTag: false,
      name: repositoryName,
      digests: Array.from(finalDigests.values())
        .sort((a, b) => {
          if (a.created > b.created) {
            return -1;
          } else if (a.created > b.created) {
            return 1;
          } else {
            return 0;
          }
        }),
    };
  }

  private async getArchitecture(name: string, tag: string) {
    const {
      data,
    } = await axios({
      method: 'GET',
      url: `${this.url}/v2/${name}/manifests/${tag}`,
      headers: {
        Accept: 'application/vnd.docker.distribution.manifest.list.v2+json', // Manifest list, aka “fat manifest”
      },
    });

    if (!data.manifests) {
      return [data.architecture];
    }

    return data.manifests.map((m) => {
      return `${m.platform.os}/${m.platform.architecture}${m.platform.variant ?? ''}`;
    });
  }

  private async getToken(): Promise<string> {
    const { data } = await axios({
      method: 'POST',
      url: `${this.url}/users/login`,
      data: {
        username: this.config.username,
        password: this.config.password
      }
    });

    return data.token;
  }
}
