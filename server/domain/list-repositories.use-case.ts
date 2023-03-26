import { Option } from '@swan-io/boxed'
import { RegistryApiRepository } from '../gateways/registry-api.gateway'
import { logger } from '../tools/logger'

export type ListRepositoryPort = { limit: number, offset: number, name: Option<string> }
export class ListRepositoryUseCase {
  constructor (private repository: RegistryApiRepository) {}

  async execute (port: ListRepositoryPort) {
    logger.info(port, 'ListRepositoryUseCase')

    const repositories = await this.repository.listRepositories(
      port.limit + 1,
      port.offset,
      port.name
    )

    const hasNext = repositories.length > port.limit

    return {
      next: hasNext,
      data: hasNext ? repositories.slice(0, -1) : repositories,
    }
  }
}
