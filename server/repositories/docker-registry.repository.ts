import { listRepositoriesTagsAnswer, RegistryApiRepository } from "../gateways/registry-api.gateway";
import axios from 'axios';
import prettyBytes from "pretty-bytes";

export type DockerApiRepositoryConfig = { url: string, username: string, password: string };

export class DockerApiRepository implements RegistryApiRepository {
  constructor(private config: DockerApiRepositoryConfig) { }

  async listRepositories(): Promise<any[]> {
    let repositories;
    try {
      ({
        data: {
          repositories,
        },
      } = await axios({
        method: 'GET',
        url: `${this.getComputedUrl()}/v2/_catalog`,
      }));
    } catch (err) {
      console.log(err.message)
      // Catch error
      // if (err.errno) {
      //   return redirect('/?error=ENOTFOUND');
      // }
      // if (err.response.status === 401) {
      //   return redirect('/?error=401');
      // }

      return [];
    };

    repositories = await Promise.all(repositories.map((repository) => {
      return axios({
        method: 'GET',
        url: `${this.getComputedUrl()}/v2/${repository}/tags/list`,
      })
        .then(({
          data,
        }) => {
          return {
            name: data.name,
            countOfTags: Array.isArray(data.tags) ? data.tags.length : 0,
          };
        })
        // eslint-disable-next-line handle-callback-err
        .catch((err) => {
          return null;
        });
    }));

    // Remove empty repository from the list
    const filteredRepositories = repositories.filter(r => r).filter(r => r.countOfTags > 0);

    return filteredRepositories;
  }

  async listRepositoriesTags(repositoryName: string): Promise<listRepositoriesTagsAnswer> {
    const { data: { tags } } = await axios({
      method: 'GET',
      url: `${this.getComputedUrl()}/v2/${repositoryName}/tags/list`,
    });

    if (tags === null) {
      return {
        noTag: true,
        name: repositoryName,
        digests: [],
      };
    }

    const tagsWithDigest = await Promise.all(tags.map(async (tag) => {
      const {
        headers: { 'docker-content-digest': digest },
        data: { layers },
      } = await axios({
        method: 'GET',
        url: `${this.getComputedUrl()}/v2/${repositoryName}/manifests/${tag}`,
        headers: {
          Accept: 'application/vnd.docker.distribution.manifest.v2+json',
        },
      });

      const architecures = await this.getArchitecture(repositoryName, tag);
      const size = layers.reduce((acc, cur) => acc + cur.size, 0);

      // Get creation date
      const { data: { history: [{ v1Compatibility }] } } = await axios({
        method: 'GET',
        url: `${this.getComputedUrl()}/v2/${repositoryName}/manifests/${tag}`,
      });

      return {
        name: tag,
        digest: digest.slice(7, 19),
        fullDigest: digest,
        size: prettyBytes(size),
        created: JSON.parse(v1Compatibility).created,
        architecures,
      };
    }));

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

  private getComputedUrl() {
    let protocol = 'https';

    if (this.config.url.includes('localhost')) {
      protocol = 'http';
    }

    return `${protocol}://${this.config.username}:${this.config.password}@${this.config.url}`;
  }

  private async getArchitecture (name: string, tag: string) {
    const {
      data,
    } = await axios({
      method: 'GET',
      url: `${this.getComputedUrl()}/v2/${name}/manifests/${tag}`,
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
}
