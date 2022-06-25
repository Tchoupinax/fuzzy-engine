import { RegistryApiRepository } from "../gateways/registry-api.gateway";

export class ListRepositoryUseCase {
  constructor(private repository: RegistryApiRepository) {}

  execute() {
    return this.repository.listRepositories();
  }
}
