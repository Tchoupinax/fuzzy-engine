export abstract class RegistryApiRepository {
  abstract listRepositories(): Promise<ContainerRepository[]>;
  abstract listRepositoriesTags(repositoryName: string): Promise<any[]>;
}

export type ContainerRepository = {
  name: string;
  countOfTags: number;
  url: string;
}
