import { Option } from '@swan-io/boxed'
import { RegistryApiRepository } from '../gateways/registry-api.gateway'

export type ListRepositoryPort = { limit: number, offset: number, name: Option<string> }
export class ListRepositoryUseCase {
  constructor (private repository: RegistryApiRepository) {}

  async execute (port: ListRepositoryPort) {
    const repositories = await this.repository.listRepositories(
      port.limit + 1,
      port.offset,
      port.name
    )

    return {
      next: repositories.length > port.limit,
      data: repositories.slice(0, -1),
    }
  }
}
