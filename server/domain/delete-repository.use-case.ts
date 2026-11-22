import type { ScalewayRegistryRepository } from "../repositories/scaleway-registry.repository";

import { logger } from "../tools/logger";

export class DeleteRepositoryUseCase {
  constructor(private repository: ScalewayRegistryRepository) {}

  execute(repositoryName: string): Promise<void> {
    const name = repositoryName.replaceAll("--slash--", "/");
    logger.info({ repositoryName: name }, "DeleteRepositoryUseCase");
    return this.repository.deleteRepository(name);
  }
}
