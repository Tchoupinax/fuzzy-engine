import { defineEventHandler, useCookies } from 'h3';
import { ListRepositoryUseCase } from '../../domain/list-repositories.use-case';
import { AwsRepository, AwsRepositoryConfig } from "../../repositories/aws.repository";
import { GithubRepository, GithubRepositoryConfig } from '../../repositories/github.repository';

export default defineEventHandler(async (request) => {
  let listRepositoryUseCase: ListRepositoryUseCase;

  const {
    'fuzzy-engine-provider': provider,
    'fuzzy-engine-aws-ecr': awsCredentials,
    'fuzzy-engine-github-ecr': githubCredentials,
    ...toto
  } = useCookies(request);

  if (provider === 'aws-ecr') {
    const { secretKey, accessKey } = {};
    // const { secretKey, accessKey } = JSON.parse(Buffer.from(credentials, 'base64').toString('ascii'));

    const awsConfig: AwsRepositoryConfig = {
      accessKey: accessKey ?? process.env.AWS_ACCESS_KEY,
      secretKey: secretKey ?? process.env.AWS_SECRET_KEY,
      region: "eu-west-3"
    };

    listRepositoryUseCase = new ListRepositoryUseCase(new AwsRepository(awsConfig));
  } else if (true || provider === "github-ecr") {
    const { nickname, token } = JSON.parse(Buffer.from(githubCredentials, 'base64').toString('ascii'));

    const githubConfig: GithubRepositoryConfig = {
      nickname,
      token,
    };

    listRepositoryUseCase = new ListRepositoryUseCase(new GithubRepository(githubConfig));
  }

  return listRepositoryUseCase.execute();
});
