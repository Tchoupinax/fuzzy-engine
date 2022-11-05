import { defineEventHandler, parseCookies } from 'h3'
import { ListRepositoryUseCase } from '../../domain/list-repositories.use-case'
import { AwsRepository, AwsRepositoryConfig } from '../../repositories/aws.repository'
import { DockerApiRepository, DockerApiRepositoryConfig } from '../../repositories/docker-registry.repository'
import { GithubRepository, GithubRepositoryConfig } from '../../repositories/github.repository'
import { DockerhubRepository, DockerhubRepositoryConfig } from '~~/server/repositories/dockerhub.repository'

export default defineEventHandler(async (request) => {
  let listRepositoryUseCase: ListRepositoryUseCase

  const {
    'fuzzy-engine-provider': provider,
    'fuzzy-engine-aws-ecr': awsCredentials,
    'fuzzy-engine-github-ecr': githubCredentials,
    'fuzzy-engine-docker-v2': dockerCredentials,
    'fuzzy-engine-dockerhub': dockerhubCredentials,
  } = parseCookies(request)

  if (provider === 'aws-ecr') {
    const { secretKey, accessKey, region } = JSON.parse(Buffer.from(awsCredentials, 'base64').toString('ascii'))

    const awsConfig: AwsRepositoryConfig = {
      accessKey,
      secretKey,
      region,
    }

    listRepositoryUseCase = new ListRepositoryUseCase(new AwsRepository(awsConfig))
  } else if (provider === 'github-ecr') {
    const { nickname, token } = JSON.parse(Buffer.from(githubCredentials, 'base64').toString('ascii'))

    const githubConfig: GithubRepositoryConfig = {
      nickname,
      token,
    }

    listRepositoryUseCase = new ListRepositoryUseCase(new GithubRepository(githubConfig))
  } else if (provider === 'dockerhub') {
    const { username, password } = JSON.parse(Buffer.from(dockerhubCredentials, 'base64').toString('ascii'))

    const dockerhubConfig: DockerhubRepositoryConfig = {
      username,
      password
    }

    listRepositoryUseCase = new ListRepositoryUseCase(new DockerhubRepository(dockerhubConfig))
  } else {
    const { url, username, password } = JSON.parse(Buffer.from(dockerCredentials, 'base64').toString('ascii'))

    const dockerRegistryConfig: DockerApiRepositoryConfig = {
      url,
      username,
      password,
    }

    listRepositoryUseCase = new ListRepositoryUseCase(new DockerApiRepository(dockerRegistryConfig))
  }

  return listRepositoryUseCase.execute()
})
