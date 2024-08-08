import { Option } from "@swan-io/boxed";

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
  size: number;
  tags: any[];
};

export type listRepositoriesTagsAnswer = {
  digests: Array<ContainerRepositoryTags>;
  name: string;
  noTag: boolean;
};

export abstract class RegistryApiRepository {
  abstract listRepositories(
    limit: number,
    offset: number,
    name: Option<string>,
  ): Promise<ContainerRepository[]>;

  abstract listRepositoriesTags(
    repositoryName: string,
  ): Promise<listRepositoriesTagsAnswer>;
}
