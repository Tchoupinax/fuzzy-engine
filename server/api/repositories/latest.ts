import { defineEventHandler } from "h3";

import { ListLatest10TagsUseCase } from "../../domain/list-latest-tags.use-case";
import { parseRegistryCookies } from "../../config/registry-config";
import {
  createRegistryRepository,
  resolveConfiguredProvider,
} from "../../tools/registry-repository.factory";
import { logger } from "../../tools/logger";

export default defineEventHandler(async (request) => {
  const startedAt = Date.now();
  logger.info("Handle /repositories/latest");

  const cookies = parseRegistryCookies(request);
  const provider = resolveConfiguredProvider(cookies);
  const listLatest10TagsUseCase = new ListLatest10TagsUseCase(
    createRegistryRepository(cookies),
  );

  logger.info({ provider }, "/repositories/latest: provider resolved");

  const result = await listLatest10TagsUseCase.execute();

  logger.info(
    {
      provider,
      durationMs: Date.now() - startedAt,
      resultCount: result.length,
    },
    "/repositories/latest: completed",
  );

  return result;
});
