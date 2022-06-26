import { RegistryApiRepository } from "../gateways/registry-api.gateway";

export class ListRepositoryTagsUseCase {
  constructor(private repository: RegistryApiRepository) {}

  execute(repositoryName: string) {
    return this.repository.listRepositoriesTags(repositoryName);
  }
}
