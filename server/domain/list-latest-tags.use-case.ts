import { Option } from '@swan-io/boxed'
import { RegistryApiRepository } from '../gateways/registry-api.gateway'

export type listLatest10TagsResult = {
  name: string;
  tag: string;
  size: number;
  createdAt: string;
};

export class ListLatest10TagsUseCase {
  constructor (private repository: RegistryApiRepository) {}

  async execute (): Promise<Array<listLatest10TagsResult>> {
    const repositories = await this.repository.listRepositories(100, 0, Option.None())
    const tags = await Promise.all(
      repositories.map(repository => this.repository.listRepositoriesTags(repository.name))
    )

    const totalData = tags.map(
      tag => tag.digests.map(
        digest => ({
          ...digest,
          ...tag
        })
      )
    ).flat()

    return totalData
      .map(item => ({
        createdAt: item.created,
        name: item.name,
        tag: item.tags.at(0),
        size: item.size,
      }))
      .sort((a, b) => {
        if (a.createdAt < b.createdAt) { return 1 }
        if (a.createdAt > b.createdAt) { return -1 }
        return 0
      })
      .slice(0, 10)
  }
}
