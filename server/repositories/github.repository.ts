import axios from 'axios';
import { ContainerRepository, listRepositoriesTagsAnswer, RegistryApiRepository } from "../gateways/registry-api.gateway";
import prettyBytes from "pretty-bytes";

export type GithubRepositoryConfig = { nickname: string, token: string };

export class GithubRepository implements RegistryApiRepository {
  constructor(private config: GithubRepositoryConfig) {}

  async listRepositories(): Promise<ContainerRepository[]> {
    const { data } = await axios({
      url: "https://api.github.com/user/packages?package_type=container",
      method: 'GET',
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${this.config.token}`
      },
    })

    return data.map(this.githubRepositoryToContainerRepository.bind(this))
  }

  async listRepositoriesTags(repositoryName: string): Promise<listRepositoriesTagsAnswer> {
    const { data } = await axios({
      url: `https://api.github.com/users/Tchoupinax/packages/container/${repositoryName}/versions`,
      method: 'GET',
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${this.config.token}`
      },
    });

    const digests = data.map((i) => {
      return {
        name: i.metadata.container.tags[0],
        digest: i.name.replace('sha256:', '').slice(0, 7),
        fullDigest: i.name,
        created: i.created_at,
        size: prettyBytes(0),
      };
    });

    const finalDigests = new Map();
    digests.forEach(({ name, digest, size, created, fullDigest }) => {
      if (finalDigests.has(created)) {
        finalDigests.set(created, {
          name: digest,
          tags: [...finalDigests.get(created).tags, name],
          size,
          created,
          fullDigest,
        });
      } else {
        finalDigests.set(created, { name: digest, tags: [name], size, created, fullDigest });
      }
    });

    return {
      name: repositoryName,
      noTag: false,
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
    }
  }

  private githubRepositoryToContainerRepository (githubRepository): ContainerRepository {
    return {
      name: githubRepository.name,
      countOfTags: 0,
      url: `https://ghcr.io/${this.config.nickname}/${githubRepository.name}`,
    }
  }

  private githubRepositoryDetailsToContainerRepositoryTag (repositoryName, details): listRepositoriesTagsAnswer {
    return {
      name: repositoryName,
      noTag: false,
      digests: details.metadata.container.tags,
    }
  }
}
