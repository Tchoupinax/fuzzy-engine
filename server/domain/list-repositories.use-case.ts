import type { Option } from "@swan-io/boxed";

import type { RegistryApiRepository } from "../gateways/registry-api.gateway";

import { logger } from "../tools/logger";

export type ListRepositoryPort = {
  limit: number;
  offset: number;
  name: Option<string>;
};
export class ListRepositoryUseCase {
  constructor(private repository: RegistryApiRepository) {}

  async execute(port: ListRepositoryPort) {
    logger.info(port, "ListRepositoryUseCase");

    let limit = port.limit + 1;
    if (port.name.isSome() || this.repository.name === "scaleway-registry") {
      limit = 100;
    }

    const repositories = await this.repository
      .listRepositories(limit, port.offset, port.name)
      .then((respositories) =>
        respositories.filter((r) => {
          if (port.name.isSome()) {
            return r.name.match(port.name.value);
          }

          return true;
        }),
      );

    let hasNext = repositories.length > port.limit + port.offset;
    if (this.repository.name === "scaleway-registry") {
      hasNext = false;
    }

    return {
      hasNext,
      data: hasNext ? repositories.slice(0, port.limit) : repositories,
    };
  }
}
