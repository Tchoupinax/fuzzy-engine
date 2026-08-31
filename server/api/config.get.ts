import { defineEventHandler } from "h3";

import { getPublicServerConfig } from "../config/registry-config";
import { logger } from "../tools/logger";

export default defineEventHandler(() => {
  logger.info("Handle /config");

  return getPublicServerConfig();
});
