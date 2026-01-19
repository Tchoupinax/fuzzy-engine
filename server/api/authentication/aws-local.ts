import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { defineEventHandler } from "h3";

import { logger } from "../../tools/logger";

export default defineEventHandler(async (request) => {
  logger.info("Handle /authentication/aws-local");

  let region = "eu-west-1";
  try {
    const { "fuzzy-engine-aws-ecr": awsCredentials } = parseCookies(request);
    if (awsCredentials) {
      const data = JSON.parse(
        Buffer.from(awsCredentials, "base64").toString("ascii"),
      );
      region = data.region;
      logger.info(`Region ${region} detected`);
    }
  } catch (err) {
    logger.error(err);
  }

  if (
    process.env.AWS_SESSION_TOKEN &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  ) {
    try {
      const client = new STSClient({ region });
      const command = new GetCallerIdentityCommand({ region });
      const response = await client.send(command);

      return {
        identity: response.UserId,
        connected: true,
      };
    } catch (err) {
      logger.error(err);
      return {
        identity: "",
        connected: false,
      };
    }
  }

  logger.info("No credentials detected");

  return {
    identity: "",
    connected: false,
  };
});
