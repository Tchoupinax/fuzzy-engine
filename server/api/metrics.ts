import { Option } from "@swan-io/boxed";
import { createError, defineEventHandler, getRequestHeader } from "h3";
import { Gauge, collectDefaultMetrics, register } from "prom-client";

import { ListRepositoryUseCase } from "../domain/list-repositories.use-case";
import { parseRegistryCookies, resolveDockerRegistryConfig } from "../config/registry-config";
import { DockerApiRepository } from "../repositories/docker-registry.repository";

collectDefaultMetrics();

const countTagByRepository = new Gauge({
  name: "docker_registry_v2_per_repository_tags_count",
  help: "Give the count of tag per repository",
  labelNames: ["repositoryName"],
});
const countRepositories = new Gauge({
  name: "docker_registry_v2_repository_count",
  help: "Give the count of repository",
});

export default defineEventHandler(async (request) => {
  let url: string;
  let username: string;
  let password: string;

  const cookies = parseRegistryCookies(request);
  const dockerRegistryConfig = resolveDockerRegistryConfig(cookies);

  if (dockerRegistryConfig) {
    ({ url, username, password } = dockerRegistryConfig);
  } else {
    const bearerToken = getRequestHeader(request, "authorization");
    if (bearerToken) {
      const token = bearerToken.split(" ").at(1)!;
      const json = JSON.parse(Buffer.from(token, "base64").toString("ascii"));
      ({ url, username, password } = json["fuzzy-engine-docker-v2"]);
    } else {
      return createError({ statusCode: 401 });
    }
  }

  const listRepositoryUseCase = new ListRepositoryUseCase(
    new DockerApiRepository({ password, url, username }),
  );
  const repositories = await listRepositoryUseCase.execute({
    name: Option.None(),
    limit: 10,
    offset: 1,
  });

  countRepositories.set(repositories.data.length);

  repositories.data.forEach((repository) => {
    countTagByRepository.labels(repository.name).set(repository.countOfTags);
  });

  setHeader(request, "content-type", register.contentType);

  return register.metrics();
});
