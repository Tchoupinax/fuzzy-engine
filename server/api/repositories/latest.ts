import { defineEventHandler, useCookies } from 'h3';
import { ListLatest10TagsUseCase } from '../../domain/list-latest-tags.use-case';
import { AwsRepository, AwsRepositoryConfig } from "../../repositories/aws.repository";
import { DockerApiRepository, DockerApiRepositoryConfig } from '../../repositories/docker-registry.repository';
import { GithubRepository, GithubRepositoryConfig } from '../../repositories/github.repository';

export default defineEventHandler(async (request) => {
  let listLatest10TagsUseCase: ListLatest10TagsUseCase;

  const {
    'fuzzy-engine-provider': provider,
    'fuzzy-engine-aws-ecr': awsCredentials,
    'fuzzy-engine-github-ecr': githubCredentials,
    'fuzzy-engine-docker-v2': dockerCredentials,
  } = useCookies(request);

  if (provider === 'aws-ecr') {
    const { secretKey, accessKey } = JSON.parse(Buffer.from(awsCredentials, 'base64').toString('ascii'));

    const awsConfig: AwsRepositoryConfig = {
      accessKey,
      secretKey,
      region: "eu-west-3"
    };

    listLatest10TagsUseCase = new ListLatest10TagsUseCase(new AwsRepository(awsConfig));
  } else if (provider === "github-ecr") {
    const { nickname, token } = JSON.parse(Buffer.from(githubCredentials, 'base64').toString('ascii'));

    const githubConfig: GithubRepositoryConfig = {
      nickname,
      token,
    };

    listLatest10TagsUseCase = new ListLatest10TagsUseCase(new GithubRepository(githubConfig));
  } else {
    const { url, username, password } = JSON.parse(Buffer.from(dockerCredentials, 'base64').toString('ascii'));

    const dockerRegistryConfig: DockerApiRepositoryConfig = {
      url,
      username,
      password,
    };

    listLatest10TagsUseCase = new ListLatest10TagsUseCase(new DockerApiRepository(dockerRegistryConfig));
  }

  return listLatest10TagsUseCase.execute();
});
