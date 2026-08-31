import { setCookie } from "~~/functions/cookies";

import type { Provider } from "../types/provider";

type PublicServerConfig = {
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

export async function syncServerConfig(): Promise<PublicServerConfig> {
  const config = await $fetch<PublicServerConfig>(
    `${new URL(window.location.toString()).origin}/api/config`,
  );

  if (!config.configured || !config.provider) {
    return config;
  }

  setCookie("fuzzy-engine-provider", config.provider);

  if (config.awsEcr) {
    setCookie(
      "fuzzy-engine-aws-ecr",
      btoa(
        JSON.stringify({
          accessKey: "",
          region: config.awsEcr.region,
          secretKey: "",
          useLocalAuthentication: config.awsEcr.useLocalAuthentication,
        }),
      ),
    );
  }

  if (config.githubRegistry) {
    setCookie(
      "fuzzy-engine-github-ecr",
      btoa(
        JSON.stringify({
          nickname: config.githubRegistry.nickname,
          token: "",
        }),
      ),
    );
  }

  if (config.dockerhub) {
    setCookie(
      "fuzzy-engine-dockerhub",
      btoa(
        JSON.stringify({
          password: "",
          username: config.dockerhub.username,
        }),
      ),
    );
  }

  if (config.dockerRegistry) {
    setCookie(
      "fuzzy-engine-docker-v2",
      btoa(JSON.stringify(config.dockerRegistry)),
    );
  }

  if (config.scalewayRegistry) {
    setCookie(
      "fuzzy-engine-scaleway-registry",
      btoa(
        JSON.stringify({
          token: "",
          url: config.scalewayRegistry.url,
        }),
      ),
    );
  }

  return config;
}
