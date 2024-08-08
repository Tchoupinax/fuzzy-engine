import {
  listRepositoriesTagsAnswer,
  RegistryApiRepository,
} from "../gateways/registry-api.gateway";

export class ListRepositoryTagsUseCase {
  constructor(private repository: RegistryApiRepository) {}

  execute(repositoryName: string): Promise<listRepositoriesTagsAnswer> {
    const name = repositoryName.replace("--slash--", "/");
    return this.repository.listRepositoriesTags(name);
  }
}
