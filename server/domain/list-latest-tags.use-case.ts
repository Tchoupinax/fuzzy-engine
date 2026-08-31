import { Option } from "@swan-io/boxed";

import type { RegistryApiRepository } from "../gateways/registry-api.gateway";
import type { ScalewayRegistryRepository } from "../repositories/scaleway-registry.repository";
import { logger } from "../tools/logger";

export type listLatest10TagsResult = {
  name: string;
  tag: string;
  size: string;
  createdAt: Date;
};

export class ListLatest10TagsUseCase {
  constructor(private repository: RegistryApiRepository) {}

  async execute(): Promise<Array<listLatest10TagsResult>> {
    const startedAt = Date.now();
    logger.info(
      { provider: this.repository.name },
      "ListLatest10TagsUseCase: started",
    );

    if (this.repository.name === "scaleway-registry") {
      logger.info("ListLatest10TagsUseCase: using Scaleway optimized path");
      const result = await (
        this.repository as ScalewayRegistryRepository
      ).listLatestTags();
      logger.info(
        {
          provider: this.repository.name,
          durationMs: Date.now() - startedAt,
          resultCount: result.length,
        },
        "ListLatest10TagsUseCase: completed",
      );
      return result;
    }

    const repositories = await this.repository.listRepositories(
      100,
      0,
      Option.None(),
    );
    logger.info(
      { repositoryCount: repositories.length },
      "ListLatest10TagsUseCase: repositories fetched",
    );

    const tags = await Promise.all(
      repositories.map((repository) =>
        this.repository.listRepositoriesTags(repository.name),
      ),
    );

    const totalData = tags
      .map((tag) =>
        tag.digests.map((digest) => ({
          ...digest,
          ...tag,
        })),
      )
      .flat();

    const result = totalData
      .map((item) => ({
        createdAt: item.created,
        name: item.name,
        tag: item.tags.at(0) ?? "",
        size: item.size,
      }))
      .sort((a, b) => {
        if (a.createdAt < b.createdAt) {
          return 1;
        }
        if (a.createdAt > b.createdAt) {
          return -1;
        }
        return 0;
      })
      .slice(0, 10);

    logger.info(
      {
        provider: this.repository.name,
        durationMs: Date.now() - startedAt,
        resultCount: result.length,
      },
      "ListLatest10TagsUseCase: completed",
    );

    return result;
  }
}
