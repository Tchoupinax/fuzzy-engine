import type { CleanupNonSemverTagsResult } from "../gateways/registry-api.gateway";
import type { ScalewayRegistryRepository } from "../repositories/scaleway-registry.repository";

import { logger } from "../tools/logger";

export class CleanupNonSemverTagsUseCase {
  constructor(private repository: ScalewayRegistryRepository) {}

  execute(olderThanMs: number): Promise<CleanupNonSemverTagsResult> {
    logger.info({ olderThanMs }, "CleanupNonSemverTagsUseCase");
    return this.repository.cleanupNonSemverTagsOlderThan(olderThanMs);
  }
}
