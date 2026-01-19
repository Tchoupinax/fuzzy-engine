import { Option } from "@swan-io/boxed";
import {
  DockerhubRepository,
  type DockerhubRepositoryConfig,
} from "~~/server/repositories/dockerhub.repository";
import { defineEventHandler, parseCookies, getQuery } from "h3";
import { match } from "ts-pattern";

import type { Provider } from "../../../types/provider";

import { ListRepositoryUseCase } from "../../domain/list-repositories.use-case";
import {
  AwsRepository,
  type AwsRepositoryConfig,
} from "../../repositories/aws.repository";
import {
  DockerApiRepository,
  type DockerApiRepositoryConfig,
} from "../../repositories/docker-registry.repository";
import {
  GithubRepository,
  type GithubRepositoryConfig,
} from "../../repositories/github.repository";
import {
  ScalewayRegistryRepository,
  type ScalewayRegistryRepositoryConfig,
} from "../../repositories/scaleway-registry.repository";
import { logger } from "../../tools/logger";

export default defineEventHandler((request) => {
  logger.info("Handle /repositories");

  const { limit, offset, name } = getQuery(request);

  const {
    "fuzzy-engine-provider": provider,
    "fuzzy-engine-aws-ecr": awsCredentials,
    "fuzzy-engine-github-ecr": githubCredentials,
    "fuzzy-engine-docker-v2": dockerCredentials,
    "fuzzy-engine-dockerhub": dockerhubCredentials,
    "fuzzy-engine-scaleway-registry": scalewayCredentials,
  } = parseCookies(request);

  const listRepositoryUseCase: ListRepositoryUseCase = match(
    provider as Provider,
  )
    .with("aws-ecr", () => {
      if (!awsCredentials) {
        throw new Error("Config must be defined");
      }

      logger.debug("List repository for AWS ECR");

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

      return new ListRepositoryUseCase(new AwsRepository(awsConfig));
    })
    .with("github-ecr", () => {
      if (!githubCredentials) {
        throw new Error("Config must be defined");
      }

      logger.debug("List repository for Github ECR");

      const { nickname, token } = JSON.parse(
        Buffer.from(githubCredentials, "base64").toString("ascii"),
      );
      const githubConfig: GithubRepositoryConfig = {
        nickname,
        token,
      };
      return new ListRepositoryUseCase(new GithubRepository(githubConfig));
    })
    .with("dockerhub", () => {
      if (!dockerhubCredentials) {
        throw new Error("Config must be defined");
      }

      logger.debug("List repository for DockerHub");

      const { username, password } = JSON.parse(
        Buffer.from(dockerhubCredentials, "base64").toString("ascii"),
      );
      const dockerhubConfig: DockerhubRepositoryConfig = {
        username,
        password,
      };
      return new ListRepositoryUseCase(
        new DockerhubRepository(dockerhubConfig),
      );
    })
    .with("docker-registry-v2", () => {
      if (!dockerCredentials) {
        throw new Error("Config must be defined");
      }

      logger.debug("List repository for docker registry v2");

      const { url, username, password } = JSON.parse(
        Buffer.from(dockerCredentials, "base64").toString("ascii"),
      );
      const dockerRegistryConfig: DockerApiRepositoryConfig = {
        url,
        username,
        password,
      };
      return new ListRepositoryUseCase(
        new DockerApiRepository(dockerRegistryConfig),
      );
    })
    .with("scaleway-registry", () => {
      if (!scalewayCredentials) {
        throw new Error("Config must be defined");
      }

      const { url, token } = JSON.parse(
        Buffer.from(scalewayCredentials, "base64").toString("ascii"),
      );
      const config: ScalewayRegistryRepositoryConfig = {
        url,
        token,
      };
      return new ListRepositoryUseCase(new ScalewayRegistryRepository(config));
    })
    .exhaustive();

  return listRepositoryUseCase.execute({
    limit: parseInt((limit as unknown as string) ?? "2", 10),
    offset: parseInt((offset as unknown as string) ?? "0", 10),
    name: Option.fromNullable(name as unknown as string),
  });
});
