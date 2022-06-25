import { ContainerRepository, RegistryApiRepository } from "../gateways/registry-api";
import axios from 'axios';

export type GithubRepositoryConfig = { nickname: string, token: string }

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

  async listRepositoriesTags(repositoryName: string): Promise<any> {

  }

  private githubRepositoryToContainerRepository (githubRepository): ContainerRepository {
    return {
      name: githubRepository.name,
      countOfTags: 0,
      url: `https://ghcr.io/${this.config.nickname}/${githubRepository.name}`,
    }
  }
}
