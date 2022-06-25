import { RegistryApiRepository } from "../gateways/registry-api";

export class ListRepositoryUseCase {
  constructor(private repository: RegistryApiRepository) {}

  execute() {
    return this.repository.listRepositories();
  }
}
