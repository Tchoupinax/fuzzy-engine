import { Option } from "@swan-io/boxed";
import { defineEventHandler, getQuery } from "h3";

import { ListRepositoryUseCase } from "../../domain/list-repositories.use-case";
import { parseRegistryCookies } from "../../config/registry-config";
import { createRegistryRepository } from "../../tools/registry-repository.factory";
import { logger } from "../../tools/logger";

export default defineEventHandler((request) => {
  logger.info("Handle /repositories");

  const { limit, offset, name } = getQuery(request);
  const cookies = parseRegistryCookies(request);
  const listRepositoryUseCase = new ListRepositoryUseCase(
    createRegistryRepository(cookies),
  );

  return listRepositoryUseCase.execute({
    limit: parseInt((limit as unknown as string) ?? "2", 10),
    offset: parseInt((offset as unknown as string) ?? "0", 10),
    name: Option.fromNullable(name as unknown as string),
  });
});
