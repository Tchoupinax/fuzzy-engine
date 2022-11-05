import { listRepositoriesTagsAnswer, RegistryApiRepository } from '../gateways/registry-api.gateway'

export class ListRepositoryTagsUseCase {
  constructor (private repository: RegistryApiRepository) {}

  execute (repositoryName: string): Promise<listRepositoriesTagsAnswer> {
    return this.repository.listRepositoriesTags(repositoryName)
  }
}
