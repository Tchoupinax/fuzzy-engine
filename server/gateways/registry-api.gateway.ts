import type { Option } from "@swan-io/boxed";
import type { Provider } from "../../types/provider";

export type ContainerRepository = {
  name: string;
  countOfTags: number;
  url: string;
};

export type ContainerRepositoryTags = {
  architectures: Array<string>;
  created: Date;
  fullDigest: string;
  name: string;
  size: string;
  tags: Array<string>;
};

export type listRepositoriesTagsAnswer = {
  digests: Array<ContainerRepositoryTags>;
  name: string;
  noTag: boolean;
};

export abstract class RegistryApiRepository {
  public name: Provider | undefined;

  abstract listRepositories(
    limit: number,
    offset: number,
    name: Option<string>,
  ): Promise<ContainerRepository[]>;

  abstract listRepositoriesTags(
    repositoryName: string,
  ): Promise<listRepositoriesTagsAnswer>;
}
