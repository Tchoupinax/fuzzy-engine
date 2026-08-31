import { parseCookies, type H3Event } from "h3";

import type { Provider } from "../../types/provider";
import type { AwsRepositoryConfig } from "../repositories/aws.repository";
import type { DockerApiRepositoryConfig } from "../repositories/docker-registry.repository";
import type { DockerhubRepositoryConfig } from "../repositories/dockerhub.repository";
import type { GithubRepositoryConfig } from "../repositories/github.repository";
import type { ScalewayRegistryRepositoryConfig } from "../repositories/scaleway-registry.repository";

export type RegistryCookies = {
  provider?: string;
  awsCredentials?: string;
  githubCredentials?: string;
  dockerCredentials?: string;
  dockerhubCredentials?: string;
  scalewayCredentials?: string;
};

export type PublicServerConfig = {
  configured: boolean;
  provider?: Provider;
  awsEcr?: {
    region: string;
    useLocalAuthentication: boolean;
  };
  dockerRegistry?: {
    passwordless: boolean;
    url: string;
    username: string;
  };
  dockerhub?: {
    username: string;
  };
  githubRegistry?: {
    nickname: string;
  };
  scalewayRegistry?: {
    url: string;
  };
};

const PROVIDERS: Provider[] = [
  "aws-ecr",
  "docker-registry-v2",
  "dockerhub",
  "github-ecr",
  "scaleway-registry",
];

const PROVIDER_ALIASES: Record<string, Provider> = {
  scaleway: "scaleway-registry",
};

function decodeCredentials<T>(encoded?: string): T | null {
  if (!encoded) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64").toString("ascii")) as T;
  } catch {
    return null;
  }
}

function isProvider(value: string | undefined): value is Provider {
  return value !== undefined && PROVIDERS.includes(value as Provider);
}

function normalizeProvider(value: string | undefined): Provider | null {
  if (!value) {
    return null;
  }

  if (isProvider(value)) {
    return value;
  }

  return PROVIDER_ALIASES[value] ?? null;
}

function resolveProviderValue(cookies: RegistryCookies): Provider | null {
  return (
    normalizeProvider(cookies.provider) ??
    normalizeProvider(process.env.FUZZY_ENGINE_PROVIDER)
  );
}

export function parseRegistryCookies(event: H3Event): RegistryCookies {
  const cookies = parseCookies(event);

  return {
    provider: cookies["fuzzy-engine-provider"],
    awsCredentials: cookies["fuzzy-engine-aws-ecr"],
    githubCredentials: cookies["fuzzy-engine-github-ecr"],
    dockerCredentials: cookies["fuzzy-engine-docker-v2"],
    dockerhubCredentials: cookies["fuzzy-engine-dockerhub"],
    scalewayCredentials: cookies["fuzzy-engine-scaleway-registry"],
  };
}

export function resolveProvider(cookies: RegistryCookies): Provider {
  const provider = resolveProviderValue(cookies);

  if (!provider) {
    throw new Error("Provider must be defined");
  }

  return provider;
}

export function resolveAwsConfig(
  cookies: RegistryCookies,
): AwsRepositoryConfig | null {
  const fromCookie = decodeCredentials<{
    accessKey: string;
    region: string;
    secretKey: string;
    useLocalAuthentication?: boolean;
  }>(cookies.awsCredentials);

  if (fromCookie?.useLocalAuthentication) {
    return {
      accessKey: process.env.AWS_ACCESS_KEY_ID ?? "",
      region: fromCookie.region || process.env.AWS_REGION || "eu-west-1",
      secretKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      sessionToken: process.env.AWS_SESSION_TOKEN ?? "",
    };
  }

  if (fromCookie?.accessKey && fromCookie.secretKey && fromCookie.region) {
    return {
      accessKey: fromCookie.accessKey,
      region: fromCookie.region,
      secretKey: fromCookie.secretKey,
      sessionToken: "",
    };
  }

  if (
    resolveProviderValue(cookies) === "aws-ecr" &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  ) {
    return {
      accessKey: process.env.AWS_ACCESS_KEY_ID,
      region: process.env.AWS_REGION ?? "eu-west-1",
      secretKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN ?? "",
    };
  }

  return null;
}

export function resolveGithubConfig(
  cookies: RegistryCookies,
): GithubRepositoryConfig | null {
  const fromCookie = decodeCredentials<GithubRepositoryConfig>(
    cookies.githubCredentials,
  );

  if (fromCookie?.nickname && fromCookie.token) {
    return fromCookie;
  }

  const nickname = process.env.GITHUB_NICKNAME;
  const token = process.env.GITHUB_TOKEN;

  if (resolveProviderValue(cookies) === "github-ecr" && nickname && token) {
    return { nickname, token };
  }

  return null;
}

export function resolveDockerhubConfig(
  cookies: RegistryCookies,
): DockerhubRepositoryConfig | null {
  const fromCookie = decodeCredentials<DockerhubRepositoryConfig>(
    cookies.dockerhubCredentials,
  );

  if (fromCookie?.username && fromCookie.password) {
    return fromCookie;
  }

  const username = process.env.DOCKERHUB_USERNAME;
  const password = process.env.DOCKERHUB_TOKEN ?? process.env.DOCKERHUB_PASSWORD;

  if (
    resolveProviderValue(cookies) === "dockerhub" &&
    username &&
    password
  ) {
    return { password, username };
  }

  return null;
}

export function resolveDockerRegistryConfig(
  cookies: RegistryCookies,
): DockerApiRepositoryConfig | null {
  const fromCookie = decodeCredentials<
    DockerApiRepositoryConfig & { passwordless?: boolean }
  >(cookies.dockerCredentials);

  if (fromCookie?.url) {
    if (
      fromCookie.passwordless ||
      (fromCookie.username && fromCookie.password)
    ) {
      return {
        password: fromCookie.password ?? "",
        url: fromCookie.url,
        username: fromCookie.username ?? "",
      };
    }
  }

  const url = process.env.DOCKER_REGISTRY_URL;
  const username = process.env.DOCKER_REGISTRY_USERNAME ?? "";
  const password = process.env.DOCKER_REGISTRY_PASSWORD ?? "";
  const passwordless =
    process.env.DOCKER_REGISTRY_PASSWORDLESS === "true" ||
    process.env.DOCKER_REGISTRY_PASSWORDLESS === "1";

  if (resolveProviderValue(cookies) === "docker-registry-v2" && url) {
    if (passwordless || (username && password)) {
      return { password, url, username };
    }
  }

  return null;
}

export function resolveScalewayConfig(
  cookies: RegistryCookies,
): ScalewayRegistryRepositoryConfig | null {
  const fromCookie = decodeCredentials<ScalewayRegistryRepositoryConfig>(
    cookies.scalewayCredentials,
  );

  if (fromCookie?.url && fromCookie.token) {
    return fromCookie;
  }

  const url = process.env.SCALEWAY_REGISTRY_URL;
  const token = process.env.SCALEWAY_REGISTRY_TOKEN;

  if (resolveProviderValue(cookies) === "scaleway-registry" && url && token) {
    return { token, url };
  }

  return null;
}

export function getPublicServerConfig(): PublicServerConfig {
  const provider = normalizeProvider(process.env.FUZZY_ENGINE_PROVIDER);

  if (!provider) {
    return { configured: false };
  }

  const cookies: RegistryCookies = { provider };

  const publicConfig: PublicServerConfig = {
    configured: true,
    provider,
  };

  if (provider === "aws-ecr" && resolveAwsConfig(cookies)) {
    publicConfig.awsEcr = {
      region: process.env.AWS_REGION ?? "eu-west-1",
      useLocalAuthentication: Boolean(process.env.AWS_SESSION_TOKEN),
    };
  }

  if (provider === "github-ecr") {
    const config = resolveGithubConfig(cookies);
    if (config) {
      publicConfig.githubRegistry = { nickname: config.nickname };
    }
  }

  if (provider === "dockerhub") {
    const config = resolveDockerhubConfig(cookies);
    if (config) {
      publicConfig.dockerhub = { username: config.username };
    }
  }

  if (provider === "docker-registry-v2") {
    const config = resolveDockerRegistryConfig(cookies);
    if (config) {
      publicConfig.dockerRegistry = {
        passwordless:
          process.env.DOCKER_REGISTRY_PASSWORDLESS === "true" ||
          process.env.DOCKER_REGISTRY_PASSWORDLESS === "1",
        url: config.url,
        username: config.username,
      };
    }
  }

  if (provider === "scaleway-registry") {
    const config = resolveScalewayConfig(cookies);
    if (config) {
      publicConfig.scalewayRegistry = { url: config.url };
    }
  }

  if (
  (provider === "aws-ecr" && !publicConfig.awsEcr) ||
  (provider === "github-ecr" && !publicConfig.githubRegistry) ||
  (provider === "dockerhub" && !publicConfig.dockerhub) ||
  (provider === "docker-registry-v2" && !publicConfig.dockerRegistry) ||
  (provider === "scaleway-registry" && !publicConfig.scalewayRegistry)
  ) {
    return { configured: false };
  }

  return publicConfig;
}
