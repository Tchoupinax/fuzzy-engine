import { defineEventHandler, parseCookies } from 'h3'
import { ListRepositoryTagsUseCase } from '../../../domain/list-repositories-tags.use-case'
import { AwsRepository, AwsRepositoryConfig } from '../../../repositories/aws.repository'
import { DockerApiRepository, DockerApiRepositoryConfig } from '../../../repositories/docker-registry.repository'
import { GithubRepository, GithubRepositoryConfig } from '../../../repositories/github.repository'
import { DockerhubRepository, DockerhubRepositoryConfig } from '~~/server/repositories/dockerhub.repository'

export default defineEventHandler((request) => {
  let listRepositoryTagsUseCase: ListRepositoryTagsUseCase

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
      useCLI: true
    }

    listRepositoryTagsUseCase = new ListRepositoryTagsUseCase(new AwsRepository(awsConfig))
  } else if (provider === 'github-ecr') {
    const { nickname, token } = JSON.parse(Buffer.from(githubCredentials, 'base64').toString('ascii'))

    const githubConfig: GithubRepositoryConfig = {
      nickname,
      token,
    }

    listRepositoryTagsUseCase = new ListRepositoryTagsUseCase(new GithubRepository(githubConfig))
  } else if (provider === 'dockerhub') {
    const { username, password } = JSON.parse(Buffer.from(dockerhubCredentials, 'base64').toString('ascii'))

    const dockerhubConfig: DockerhubRepositoryConfig = {
      username,
      password
    }

    listRepositoryTagsUseCase = new ListRepositoryTagsUseCase(new DockerhubRepository(dockerhubConfig))
  } else {
    const { url, username, password } = JSON.parse(Buffer.from(dockerCredentials, 'base64').toString('ascii'))

    const dockerRegistryConfig: DockerApiRepositoryConfig = {
      url,
      username,
      password,
    }

    listRepositoryTagsUseCase = new ListRepositoryTagsUseCase(new DockerApiRepository(dockerRegistryConfig))
  }

  return listRepositoryTagsUseCase.execute(request.context.params.name)
})
