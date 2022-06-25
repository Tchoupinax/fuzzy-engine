import { DockerApiRepository } from "../gateways/registry-api";

export class ListRepositoryTagsUseCase {
  constructor(private repository: DockerApiRepository) {}

  execute(repositoryName: string) {
    return this.repository.listRepositoriesTags(repositoryName);
  }
}
