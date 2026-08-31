import { createError, defineEventHandler, parseCookies, readBody } from "h3";

import { CleanupNonSemverTagsUseCase } from "../../domain/cleanup-non-semver-tags.use-case";
import {
  ScalewayRegistryRepository,
  type ScalewayRegistryRepositoryConfig,
} from "../../repositories/scaleway-registry.repository";
import { logger } from "../../tools/logger";

type CleanupBody = {
  durationUnit?: "days" | "months" | "weeks";
  durationValue?: number;
};

function durationToMs(value: number, unit: CleanupBody["durationUnit"]): number {
  const dayMs = 86_400_000;

  if (unit === "weeks") {
    return value * 7 * dayMs;
  }

  if (unit === "months") {
    return value * 30 * dayMs;
  }

  return value * dayMs;
}

export default defineEventHandler(async (event) => {
  logger.info("Handle POST /repositories/cleanup-non-semver");

  const {
    "fuzzy-engine-provider": provider,
    "fuzzy-engine-scaleway-registry": scalewayCredentials,
  } = parseCookies(event);

  if (provider !== "scaleway-registry") {
    throw createError({
      message: "Tag cleanup is only supported for Scaleway registry",
      statusCode: 501,
    });
  }

  if (!scalewayCredentials) {
    throw createError({
      message: "Scaleway credentials are missing",
      statusCode: 401,
    });
  }

  const body = await readBody<CleanupBody>(event);
  const durationValue = Number(body.durationValue);
  const durationUnit = body.durationUnit ?? "days";

  if (!Number.isFinite(durationValue) || durationValue <= 0) {
    throw createError({
      message: "Duration must be a positive number",
      statusCode: 400,
    });
  }

  if (!["days", "weeks", "months"].includes(durationUnit)) {
    throw createError({
      message: "Duration unit must be days, weeks, or months",
      statusCode: 400,
    });
  }

  const { url, token } = JSON.parse(
    Buffer.from(scalewayCredentials, "base64").toString("ascii"),
  ) as ScalewayRegistryRepositoryConfig;

  const useCase = new CleanupNonSemverTagsUseCase(
    new ScalewayRegistryRepository({ token, url }),
  );

  return useCase.execute(durationToMs(durationValue, durationUnit));
});
