export type ContainerRepository = {
  name: string;
  countOfTags: number;
  url: string;
}

export type ContainerRepositoryTags = {
  name: string;
  tags: any[];
  size: number;
  created: Date;
  fullDigest: string;
}

export type listRepositoriesTagsAnswer = {
  name: string;
  noTag: boolean;
  digests: ContainerRepositoryTags[];
}

export abstract class RegistryApiRepository {
  abstract listRepositories(limit: number, offset: number): Promise<ContainerRepository[]>;
  abstract listRepositoriesTags(repositoryName: string): Promise<listRepositoriesTagsAnswer>;
}
