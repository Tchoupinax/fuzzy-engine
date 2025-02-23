import {
  DockerhubRepository,
  type DockerhubRepositoryConfig,
} from "~~/server/repositories/dockerhub.repository";
import { defineEventHandler, parseCookies } from "h3";
import { match } from "ts-pattern";

import type { Provider } from "../../../../types/provider";
import {
  ScalewayRegistryRepository,
  type ScalewayRegistryRepositoryConfig,
} from "../../../repositories/scaleway-registry.repository";

import { ListRepositoryTagsUseCase } from "../../../domain/list-repositories-tags.use-case";
import {
  AwsRepository,
  type AwsRepositoryConfig,
} from "../../../repositories/aws.repository";
import {
  DockerApiRepository,
  type DockerApiRepositoryConfig,
} from "../../../repositories/docker-registry.repository";
import {
  GithubRepository,
  type GithubRepositoryConfig,
} from "../../../repositories/github.repository";
import { logger } from "../../../tools/logger";

export default defineEventHandler((request) => {
  logger.info(`Handle /${request.context.params?.name}/tags`);

  const {
    "fuzzy-engine-provider": provider,
    "fuzzy-engine-aws-ecr": awsCredentials,
    "fuzzy-engine-github-ecr": githubCredentials,
    "fuzzy-engine-docker-v2": dockerCredentials,
    "fuzzy-engine-dockerhub": dockerhubCredentials,
    "fuzzy-engine-scaleway-registry": scalewayCredentials,
  } = parseCookies(request);

  const listRepositoryTagsUseCase: ListRepositoryTagsUseCase = match(
    provider as Provider,
  )
    .with("aws-ecr", () => {
      logger.debug("List repository tags for AWS ECR");

      console.log(awsCredentials);
      let sessionToken = "";
      let accessKey = "";
      let secretKey = "";
      const region = "eu-west-1";

      try {
        const { secretKey: incomingSecretKey, accessKey: incomingAccessKey } =
          JSON.parse(Buffer.from(awsCredentials, "base64").toString("ascii"));

        sessionToken = "";
        accessKey = incomingAccessKey;
        secretKey = incomingSecretKey;
      } catch {
        sessionToken = process.env.AWS_SESSION_TOKEN ?? "";
        accessKey = process.env.AWS_ACCESS_KEY_ID ?? "";
        secretKey = process.env.AWS_SECRET_ACCESS_KEY ?? "";
      }

      const awsConfig: AwsRepositoryConfig = {
        accessKey,
        secretKey,
        region,
        sessionToken,
      };
      return new ListRepositoryTagsUseCase(new AwsRepository(awsConfig));
    })
    .with("github-ecr", () => {
      logger.debug("List repository tags for Github ECR");

      const { nickname, token } = JSON.parse(
        Buffer.from(githubCredentials, "base64").toString("ascii"),
      );
      const githubConfig: GithubRepositoryConfig = {
        nickname,
        token,
      };
      return new ListRepositoryTagsUseCase(new GithubRepository(githubConfig));
    })
    .with("dockerhub", () => {
      logger.debug("List repository tags for DockerHub");

      const { username, password } = JSON.parse(
        Buffer.from(dockerhubCredentials, "base64").toString("ascii"),
      );
      const dockerhubConfig: DockerhubRepositoryConfig = {
        username,
        password,
      };
      return new ListRepositoryTagsUseCase(
        new DockerhubRepository(dockerhubConfig),
      );
    })
    .with("docker-registry-v2", () => {
      logger.debug("List repository tags for docker registry v2");

      const { url, username, password } = JSON.parse(
        Buffer.from(dockerCredentials, "base64").toString("ascii"),
      );
      const dockerRegistryConfig: DockerApiRepositoryConfig = {
        url,
        username,
        password,
      };
      return new ListRepositoryTagsUseCase(
        new DockerApiRepository(dockerRegistryConfig),
      );
    })
    .with("scaleway-registry", () => {
      const { url, token } = JSON.parse(
        Buffer.from(scalewayCredentials, "base64").toString("ascii"),
      );
      const config: ScalewayRegistryRepositoryConfig = {
        url,
        token,
      };
      return new ListRepositoryTagsUseCase(
        new ScalewayRegistryRepository(config),
      );
    })
    .exhaustive();

  return listRepositoryTagsUseCase.execute(request.context.params?.name!);
});
