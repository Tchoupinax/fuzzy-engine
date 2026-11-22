import { createError, defineEventHandler, readBody } from "h3";

import { DeleteAllRepositoriesUseCase } from "../../domain/delete-all-repositories.use-case";
import { parseRegistryCookies } from "../../config/registry-config";
import {
  createScalewayRegistryRepository,
  resolveConfiguredProvider,
} from "../../tools/registry-repository.factory";
import { logger } from "../../tools/logger";

type DeleteAllBody = {
  confirm?: string;
};

const REQUIRED_CONFIRMATION = "DELETE ALL";

export default defineEventHandler(async (event) => {
  logger.info("Handle POST /repositories/delete-all");

  const body = await readBody<DeleteAllBody>(event);

  if (body?.confirm !== REQUIRED_CONFIRMATION) {
    throw createError({
      message: `Confirmation required: send { "confirm": "${REQUIRED_CONFIRMATION}" }`,
      statusCode: 400,
    });
  }

  const cookies = parseRegistryCookies(event);
  const provider = resolveConfiguredProvider(cookies);

  if (provider !== "scaleway-registry") {
    throw createError({
      message: "Deleting all repositories is only supported for Scaleway registry",
      statusCode: 501,
    });
  }

  const useCase = new DeleteAllRepositoriesUseCase(
    createScalewayRegistryRepository(cookies),
  );

  return useCase.execute();
});