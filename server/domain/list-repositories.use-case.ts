import { Option } from "@swan-io/boxed";
import { RegistryApiRepository } from "../gateways/registry-api.gateway";
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

    let limit = port.limit +1;
    if (port.name.isSome()) {
      limit = 100;
    }

    const repositories = await this.repository.listRepositories(
      limit,
      port.offset,
      port.name,
    ).then(respositories => respositories.filter(
      r => {
        if (port.name.isSome()) {
          return r.name.match(port.name.value);
        }

        return true;
      }
    ));

    const hasNext = repositories.length > port.limit + port.offset;

    return {
      hasNext,
      data: hasNext ? repositories.slice(0, port.limit) : repositories,
    };
  }
}
