import { createError, defineEventHandler } from "h3";

import { DeleteRepositoryUseCase } from "../../../domain/delete-repository.use-case";
import { parseRegistryCookies } from "../../../config/registry-config";
import {
  createScalewayRegistryRepository,
  resolveConfiguredProvider,
} from "../../../tools/registry-repository.factory";
import { logger } from "../../../tools/logger";

export default defineEventHandler(async (event) => {
  const name = event.context.params?.name;
  logger.info({ name }, "Handle DELETE /repositories/:name");

  if (!name) {
    throw createError({
      message: "Repository name is required",
      statusCode: 400,
    });
  }

  const cookies = parseRegistryCookies(event);
  const provider = resolveConfiguredProvider(cookies);

  if (provider !== "scaleway-registry") {
    throw createError({
      message: "Deleting a repository is only supported for Scaleway registry",
      statusCode: 501,
    });
  }

  const useCase = new DeleteRepositoryUseCase(
    createScalewayRegistryRepository(cookies),
  );

  try {
    await useCase.execute(name);
    return { deleted: true, name: name.replaceAll("--slash--", "/") };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete repository";

    throw createError({
      message,
      statusCode: message.includes("not found") ? 404 : 500,
    });
  }
});