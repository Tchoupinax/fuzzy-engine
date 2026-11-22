import type { ScalewayRegistryRepository } from "../repositories/scaleway-registry.repository";

import { logger } from "../tools/logger";

export class DeleteAllRepositoriesUseCase {
  constructor(private repository: ScalewayRegistryRepository) {}

  execute(): Promise<{
    deleted: number;
    failed: Array<{ image: string; reason: string }>;
  }> {
    logger.info("DeleteAllRepositoriesUseCase");
    return this.repository.deleteAllRepositories();
  }
}
