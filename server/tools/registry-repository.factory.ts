import { match } from "ts-pattern";

import type { Provider } from "../../types/provider";
import type { RegistryApiRepository } from "../gateways/registry-api.gateway";
import {
  type RegistryCookies,
  resolveAwsConfig,
  resolveDockerhubConfig,
  resolveDockerRegistryConfig,
  resolveGithubConfig,
  resolveProvider,
  resolveScalewayConfig,
} from "../config/registry-config";
import {
  AwsRepository,
} from "../repositories/aws.repository";
import {
  DockerApiRepository,
} from "../repositories/docker-registry.repository";
import {
  DockerhubRepository,
} from "../repositories/dockerhub.repository";
import {
  GithubRepository,
} from "../repositories/github.repository";
import {
  ScalewayRegistryRepository,
} from "../repositories/scaleway-registry.repository";

export function createRegistryRepository(
  cookies: RegistryCookies,
): RegistryApiRepository {
  const provider = resolveProvider(cookies);

  return match(provider)
    .with("aws-ecr", () => {
      const config = resolveAwsConfig(cookies);
      if (!config) {
        throw new Error("AWS ECR config must be defined");
      }

      return new AwsRepository(config);
    })
    .with("github-ecr", () => {
      const config = resolveGithubConfig(cookies);
      if (!config) {
        throw new Error("Github ECR config must be defined");
      }

      return new GithubRepository(config);
    })
    .with("dockerhub", () => {
      const config = resolveDockerhubConfig(cookies);
      if (!config) {
        throw new Error("DockerHub config must be defined");
      }

      return new DockerhubRepository(config);
    })
    .with("docker-registry-v2", () => {
      const config = resolveDockerRegistryConfig(cookies);
      if (!config) {
        throw new Error("Docker registry config must be defined");
      }

      return new DockerApiRepository(config);
    })
    .with("scaleway-registry", () => {
      const config = resolveScalewayConfig(cookies);
      if (!config) {
        throw new Error("Scaleway registry config must be defined");
      }

      return new ScalewayRegistryRepository(config);
    })
    .exhaustive();
}

export function createScalewayRegistryRepository(
  cookies: RegistryCookies,
): ScalewayRegistryRepository {
  const config = resolveScalewayConfig(cookies);
  if (!config) {
    throw new Error("Scaleway registry config must be defined");
  }

  return new ScalewayRegistryRepository(config);
}

export function resolveConfiguredProvider(cookies: RegistryCookies): Provider {
  return resolveProvider(cookies);
}
