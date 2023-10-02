import { defineEventHandler, parseCookies, readBody } from 'h3'
import { match } from 'ts-pattern'
import { AwsRepository, AwsRepositoryConfig } from '../../../repositories/aws.repository'
import { DockerApiRepository, DockerApiRepositoryConfig } from '../../../repositories/docker-registry.repository'
import { GithubRepository, GithubRepositoryConfig } from '../../../repositories/github.repository'
import { logger } from '../../../tools/logger'
import { Provider } from '../../../../types/provider'
import { DeleteImageDigestUseCase } from '../../../domain/delete-image-digest.use-case'
import { DockerhubRepository, DockerhubRepositoryConfig } from '~~/server/repositories/dockerhub.repository'

export default defineEventHandler(async (request) => {
  logger.info(`Handle DELETE /${request.context.params?.name}/tags`)

  const {
    'fuzzy-engine-provider': provider,
    'fuzzy-engine-aws-ecr': awsCredentials,
    'fuzzy-engine-github-ecr': githubCredentials,
    'fuzzy-engine-docker-v2': dockerCredentials,
    'fuzzy-engine-dockerhub': dockerhubCredentials,
  } = parseCookies(request)

  const deleteImageDigestUseCase: DeleteImageDigestUseCase = match(provider as Provider)
    .with('aws-ecr', () => {
      const {
        secretKey: incomingSecretKey,
        accessKey: incomingAccessKey,
        region,
        useLocalAuthentication
      } = JSON.parse(Buffer.from(awsCredentials, 'base64').toString('ascii'))

      let sessionToken = ''
      let accessKey = incomingAccessKey
      let secretKey = incomingSecretKey

      if (useLocalAuthentication) {
        sessionToken = process.env.AWS_SESSION_TOKEN ?? ''
        accessKey = process.env.AWS_ACCESS_KEY_ID ?? ''
        secretKey = process.env.AWS_SECRET_ACCESS_KEY ?? ''
      }

      const awsConfig: AwsRepositoryConfig = {
        accessKey,
        secretKey,
        region,
        sessionToken,
      }
      return new DeleteImageDigestUseCase(new AwsRepository(awsConfig))
    })
    .with('github-ecr', () => {
      const { nickname, token } = JSON.parse(Buffer.from(githubCredentials, 'base64').toString('ascii'))
      const githubConfig: GithubRepositoryConfig = {
        nickname,
        token,
      }
      return new DeleteImageDigestUseCase(new GithubRepository(githubConfig))
    })
    .with('dockerhub', () => {
      const { username, password } = JSON.parse(Buffer.from(dockerhubCredentials, 'base64').toString('ascii'))
      const dockerhubConfig: DockerhubRepositoryConfig = {
        username,
        password
      }
      return new DeleteImageDigestUseCase(new DockerhubRepository(dockerhubConfig))
    })
    .with('docker-registry-v2', () => {
      const { url, username, password } = JSON.parse(Buffer.from(dockerCredentials, 'base64').toString('ascii'))
      const dockerRegistryConfig: DockerApiRepositoryConfig = {
        url,
        username,
        password,
      }
      return new DeleteImageDigestUseCase(new DockerApiRepository(dockerRegistryConfig))
    })
    .exhaustive()

  const { tag } = await readBody(request)
  return deleteImageDigestUseCase.execute({ tag, repositoryName: request.context.params?.name! })
})
