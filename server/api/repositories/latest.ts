import { defineEventHandler, parseCookies } from 'h3'
import { match } from 'ts-pattern'
import { Provider } from '../../../types/provider'
import { ListLatest10TagsUseCase } from '../../domain/list-latest-tags.use-case'
import { AwsRepository, AwsRepositoryConfig } from '../../repositories/aws.repository'
import { DockerApiRepository, DockerApiRepositoryConfig } from '../../repositories/docker-registry.repository'
import { DockerhubRepositoryConfig, DockerhubRepository } from '../../repositories/dockerhub.repository'
import { GithubRepository, GithubRepositoryConfig } from '../../repositories/github.repository'
import { logger } from '../../tools/logger'

export default defineEventHandler((request) => {
  logger.info('Handle /repositories/latest')

  const {
    'fuzzy-engine-provider': provider,
    'fuzzy-engine-aws-ecr': awsCredentials,
    'fuzzy-engine-github-ecr': githubCredentials,
    'fuzzy-engine-docker-v2': dockerCredentials,
    'fuzzy-engine-dockerhub': dockerhubCredentials,
  } = parseCookies(request)

  const listLatest10TagsUseCase: ListLatest10TagsUseCase = match(provider as Provider)
    .with('aws-ecr', () => {
      const { secretKey, accessKey, region } = JSON.parse(Buffer.from(awsCredentials, 'base64').toString('ascii'))
      const awsConfig: AwsRepositoryConfig = {
        accessKey,
        secretKey,
        region,
        sessionToken: ''
      }
      return new ListLatest10TagsUseCase(new AwsRepository(awsConfig))
    })
    .with('github-ecr', () => {
      const { nickname, token } = JSON.parse(Buffer.from(githubCredentials, 'base64').toString('ascii'))
      const githubConfig: GithubRepositoryConfig = {
        nickname,
        token,
      }
      return new ListLatest10TagsUseCase(new GithubRepository(githubConfig))
    })
    .with('docker-registry-v2', () => {
      const { url, username, password } = JSON.parse(Buffer.from(dockerCredentials, 'base64').toString('ascii'))
      const dockerRegistryConfig: DockerApiRepositoryConfig = {
        url,
        username,
        password,
      }
      return new ListLatest10TagsUseCase(new DockerApiRepository(dockerRegistryConfig))
    })
    .with('dockerhub', () => {
      const { username, password } = JSON.parse(Buffer.from(dockerhubCredentials, 'base64').toString('ascii'))
      const dockerhubConfig: DockerhubRepositoryConfig = {
        username,
        password
      }
      return new ListLatest10TagsUseCase(new DockerhubRepository(dockerhubConfig))
    })
    .exhaustive()

  return listLatest10TagsUseCase.execute()
})
