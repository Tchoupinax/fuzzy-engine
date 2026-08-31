import { defineEventHandler } from "h3";

import { ListRepositoryTagsUseCase } from "../../../domain/list-repositories-tags.use-case";
import { parseRegistryCookies } from "../../../config/registry-config";
import { createRegistryRepository } from "../../../tools/registry-repository.factory";
import { logger } from "../../../tools/logger";

export default defineEventHandler((request) => {
  logger.info(`Handle /${request.context.params?.name}/tags`);

  const cookies = parseRegistryCookies(request);
  const listRepositoryTagsUseCase = new ListRepositoryTagsUseCase(
    createRegistryRepository(cookies),
  );

  if (!request?.context?.params?.name) {
    throw new Error("Param name is mandatory");
  }

  return listRepositoryTagsUseCase.execute(request.context.params.name);
});
