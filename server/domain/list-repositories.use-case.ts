import { RegistryApiRepository } from '../gateways/registry-api.gateway'

export class ListRepositoryUseCase {
  constructor (private repository: RegistryApiRepository) {}

  execute (port: { limit: number, offset: number }) {
    return this.repository.listRepositories(port.limit, port.offset)
  }
}
