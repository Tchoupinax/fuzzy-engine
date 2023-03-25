import { defineEventHandler, parseCookies, getQuery } from 'h3'
import { Option } from '@swan-io/boxed'
import { match } from 'ts-pattern'
import { ListRepositoryUseCase } from '../../domain/list-repositories.use-case'
import { AwsRepository, AwsRepositoryConfig } from '../../repositories/aws.repository'
import { DockerApiRepository, DockerApiRepositoryConfig } from '../../repositories/docker-registry.repository'
import { GithubRepository, GithubRepositoryConfig } from '../../repositories/github.repository'
import { Provider } from '../../../types/provider'
import { logger } from '../../tools/logger'
import { DockerhubRepository, DockerhubRepositoryConfig } from '~~/server/repositories/dockerhub.repository'

export default defineEventHandler((request) => {
  logger.info('Handle /repositories')

  const { limit, offset, name } = getQuery(request)

  const {
    'fuzzy-engine-provider': provider,
    'fuzzy-engine-aws-ecr': awsCredentials,
    'fuzzy-engine-github-ecr': githubCredentials,
    'fuzzy-engine-docker-v2': dockerCredentials,
    'fuzzy-engine-dockerhub': dockerhubCredentials,
  } = parseCookies(request)

  const listRepositoryUseCase: ListRepositoryUseCase = match(provider as Provider)
    .with('aws-ecr', () => {
      logger.debug('List repository for AWS ECR')

      const { secretKey, accessKey, region, useCLI } = JSON.parse(Buffer.from(awsCredentials, 'base64').toString('ascii'))
      const awsConfig: AwsRepositoryConfig = {
        accessKey,
        secretKey,
        region,
        useCLI
      }
      return new ListRepositoryUseCase(new AwsRepository(awsConfig))
    })
    .with('github-ecr', () => {
      logger.debug('List repository for Github ECR')

      const { nickname, token } = JSON.parse(Buffer.from(githubCredentials, 'base64').toString('ascii'))
      const githubConfig: GithubRepositoryConfig = {
        nickname,
        token,
      }
      return new ListRepositoryUseCase(new GithubRepository(githubConfig))
    })
    .with('dockerhub', () => {
      logger.debug('List repository for DockerHub')

      const { username, password } = JSON.parse(Buffer.from(dockerhubCredentials, 'base64').toString('ascii'))
      const dockerhubConfig: DockerhubRepositoryConfig = {
        username,
        password
      }
      return new ListRepositoryUseCase(new DockerhubRepository(dockerhubConfig))
    })
    .with('docker-registry-v2', () => {
      logger.debug('List repository for docker registry v2')

      const { url, username, password } = JSON.parse(Buffer.from(dockerCredentials, 'base64').toString('ascii'))
      const dockerRegistryConfig: DockerApiRepositoryConfig = {
        url,
        username,
        password,
      }
      return new ListRepositoryUseCase(new DockerApiRepository(dockerRegistryConfig))
    })
    .exhaustive()

  return listRepositoryUseCase.execute({
    limit: parseInt(limit as unknown as string ?? '2', 10),
    offset: parseInt(offset as unknown as string ?? '0', 10),
    name: Option.fromNullable(name as unknown as string),
  })
})
