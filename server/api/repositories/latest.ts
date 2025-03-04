import { defineEventHandler, parseCookies } from "h3";
import { match } from "ts-pattern";

import type { Provider } from "../../../types/provider";

import { ListLatest10TagsUseCase } from "../../domain/list-latest-tags.use-case";
import {
  AwsRepository,
  type AwsRepositoryConfig,
} from "../../repositories/aws.repository";
import {
  DockerApiRepository,
  type DockerApiRepositoryConfig,
} from "../../repositories/docker-registry.repository";
import {
  type DockerhubRepositoryConfig,
  DockerhubRepository,
} from "../../repositories/dockerhub.repository";
import {
  GithubRepository,
  type GithubRepositoryConfig,
} from "../../repositories/github.repository";
import {
  type ScalewayRegistryRepositoryConfig,
  ScalewayRegistryRepository,
} from "../../repositories/scaleway-registry.repository";
import { logger } from "../../tools/logger";

export default defineEventHandler((request) => {
  logger.info("Handle /repositories/latest");

  const {
    "fuzzy-engine-provider": provider,
    "fuzzy-engine-aws-ecr": awsCredentials,
    "fuzzy-engine-github-ecr": githubCredentials,
    "fuzzy-engine-docker-v2": dockerCredentials,
    "fuzzy-engine-dockerhub": dockerhubCredentials,
    "fuzzy-engine-scaleway-registry": scalewayCredentials,
  } = parseCookies(request);

  const listLatest10TagsUseCase: ListLatest10TagsUseCase = match(
    provider as Provider,
  )
    .with("aws-ecr", () => {
      const {
        secretKey: incomingSecretKey,
        accessKey: incomingAccessKey,
        region,
        useLocalAuthentication,
      } = JSON.parse(Buffer.from(awsCredentials, "base64").toString("ascii"));

      let sessionToken = "";
      let accessKey = incomingAccessKey;
      let secretKey = incomingSecretKey;

      if (useLocalAuthentication) {
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
      return new ListLatest10TagsUseCase(new AwsRepository(awsConfig));
    })
    .with("github-ecr", () => {
      const { nickname, token } = JSON.parse(
        Buffer.from(githubCredentials, "base64").toString("ascii"),
      );
      const githubConfig: GithubRepositoryConfig = {
        nickname,
        token,
      };
      return new ListLatest10TagsUseCase(new GithubRepository(githubConfig));
    })
    .with("docker-registry-v2", () => {
      const { url, username, password } = JSON.parse(
        Buffer.from(dockerCredentials, "base64").toString("ascii"),
      );
      const dockerRegistryConfig: DockerApiRepositoryConfig = {
        url,
        username,
        password,
      };
      return new ListLatest10TagsUseCase(
        new DockerApiRepository(dockerRegistryConfig),
      );
    })
    .with("dockerhub", () => {
      const { username, password } = JSON.parse(
        Buffer.from(dockerhubCredentials, "base64").toString("ascii"),
      );
      const dockerhubConfig: DockerhubRepositoryConfig = {
        username,
        password,
      };
      return new ListLatest10TagsUseCase(
        new DockerhubRepository(dockerhubConfig),
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
      return new ListLatest10TagsUseCase(
        new ScalewayRegistryRepository(config),
      );
    })
    .exhaustive();

  return listLatest10TagsUseCase.execute();
});
