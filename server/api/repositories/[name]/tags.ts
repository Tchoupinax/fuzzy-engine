import { defineEventHandler, parseCookies } from 'h3'
import { match } from 'ts-pattern'
import { ListRepositoryTagsUseCase } from '../../../domain/list-repositories-tags.use-case'
import { AwsRepository, AwsRepositoryConfig } from '../../../repositories/aws.repository'
import { DockerApiRepository, DockerApiRepositoryConfig } from '../../../repositories/docker-registry.repository'
import { GithubRepository, GithubRepositoryConfig } from '../../../repositories/github.repository'
import { logger } from '../../../tools/logger'
import { Provider } from '../../../../types/provider'
import { DockerhubRepository, DockerhubRepositoryConfig } from '~~/server/repositories/dockerhub.repository'

export default defineEventHandler((request) => {
  logger.info(`Handle /${request.context.params?.name}/tags`)

  const {
    'fuzzy-engine-provider': provider,
    'fuzzy-engine-aws-ecr': awsCredentials,
    'fuzzy-engine-github-ecr': githubCredentials,
    'fuzzy-engine-docker-v2': dockerCredentials,
    'fuzzy-engine-dockerhub': dockerhubCredentials,
  } = parseCookies(request)

  const listRepositoryTagsUseCase: ListRepositoryTagsUseCase = match(provider as Provider)
    .with('aws-ecr', () => {
      logger.debug('List repository tags for AWS ECR')

      const { secretKey, accessKey, region } = JSON.parse(Buffer.from(awsCredentials, 'base64').toString('ascii'))
      const awsConfig: AwsRepositoryConfig = {
        accessKey,
        secretKey,
        region,
        useCLI: true
      }
      return new ListRepositoryTagsUseCase(new AwsRepository(awsConfig))
    })
    .with('github-ecr', () => {
      logger.debug('List repository tags for Github ECR')

      const { nickname, token } = JSON.parse(Buffer.from(githubCredentials, 'base64').toString('ascii'))
      const githubConfig: GithubRepositoryConfig = {
        nickname,
        token,
      }
      return new ListRepositoryTagsUseCase(new GithubRepository(githubConfig))
    })
    .with('dockerhub', () => {
      logger.debug('List repository tags for DockerHub')

      const { username, password } = JSON.parse(Buffer.from(dockerhubCredentials, 'base64').toString('ascii'))
      const dockerhubConfig: DockerhubRepositoryConfig = {
        username,
        password
      }
      return new ListRepositoryTagsUseCase(new DockerhubRepository(dockerhubConfig))
    })
    .with('docker-registry-v2', () => {
      logger.debug('List repository tags for docker registry v2')

      const { url, username, password } = JSON.parse(Buffer.from(dockerCredentials, 'base64').toString('ascii'))
      const dockerRegistryConfig: DockerApiRepositoryConfig = {
        url,
        username,
        password,
      }
      return new ListRepositoryTagsUseCase(new DockerApiRepository(dockerRegistryConfig))
    })
    .exhaustive()

  return listRepositoryTagsUseCase.execute(request.context.params?.name!)
})
