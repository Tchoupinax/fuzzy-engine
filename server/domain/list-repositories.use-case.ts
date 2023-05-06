import { Option } from '@swan-io/boxed'
import { RegistryApiRepository } from '../gateways/registry-api.gateway'

export class ListRepositoryUseCase {
  constructor (private repository: RegistryApiRepository) {}

  async execute (
    port: { limit: number, offset: number, name: Option<string> }
  ) {
    const repositories = await this.repository.listRepositories(port.limit, port.offset, port.name)

    return {
      next: repositories.length > port.limit,
      data: repositories,
    }
  }
}
