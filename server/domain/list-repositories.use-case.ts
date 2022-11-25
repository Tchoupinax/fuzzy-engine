import { Option } from '@swan-io/boxed'
import { RegistryApiRepository } from '../gateways/registry-api.gateway'

export class ListRepositoryUseCase {
  constructor (private repository: RegistryApiRepository) {}

  execute (
    port: { limit: number, offset: number, name: Option<string> }
  ) {
    return this.repository.listRepositories(port.limit, port.offset, port.name)
  }
}
