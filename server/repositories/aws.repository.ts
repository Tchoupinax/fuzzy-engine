import { Option } from '@swan-io/boxed'
import prettyBytes from 'pretty-bytes'
import {
  ECR,
  DescribeRepositoriesCommand,
  ListImagesCommand,
  DescribeImagesCommand,
} from '@aws-sdk/client-ecr'
import {
  ContainerRepository,
  RegistryApiRepository,
} from '../gateways/registry-api.gateway'

export type AwsRepositoryConfig = {
  accessKey: string;
  secretKey: string;
  sessionToken: string;
  region: string;
};

export class AwsRepository implements RegistryApiRepository {
  private ecrClient: ECR

  constructor (data: AwsRepositoryConfig) {
    this.ecrClient = new ECR({
      credentials: {
        accessKeyId: data.accessKey,
        secretAccessKey: data.secretKey,
        sessionToken: data.sessionToken,
      },
      region: data.region,
    })
  }

  async listRepositories (
    limit: number,
    offset: number,
    name: Option<string>
  ): Promise<ContainerRepository[]> {
    const { repositories } = await this.getRepositories(limit, offset, name)

    const arrayImageIds = await Promise.all(
      repositories.map(async (repository: any) => {
        return (await this.listImages(repository.repositoryName)).imageIds
      })
    )

    return repositories.map(
      ({ repositoryName, repositoryUri }: any, index: number) => ({
        name: repositoryName ?? '',
        countOfTags: arrayImageIds[index]?.length ?? 0,
        url: repositoryUri ?? '',
      })
    )
  }

  async listRepositoriesTags (repositoryName: string): Promise<any> {
    const { imageDetails } = await this.ecrClient.send(
      new DescribeImagesCommand({ repositoryName })
    )

    const digests = imageDetails!.map((i) => {
      return {
        name: repositoryName,
        digest: i?.imageDigest?.replace('sha256:', '').slice(7, 19),
        fullDigest: i.imageDigest,
        created: i.imagePushedAt,
        size: prettyBytes(i?.imageSizeInBytes || 0),
      }
    })

    const finalDigests = new Map()
    // @ts-ignore
    digests.forEach(({ name, digest, size, created, fullDigest }) => {
      if (finalDigests.has(digest)) {
        finalDigests.set(digest, {
          name: digest,
          tags: [...finalDigests.get(digest).tags, name].flat(),
          size,
          created,
          fullDigest,
        })
      } else {
        finalDigests.set(digest, {
          name: digest,
          tags: [name].flat(),
          size,
          created,
          fullDigest
        })
      }
    })

    return {
      noTag: false,
      name: repositoryName,
      digests: Array.from(finalDigests.values()).sort((a, b) => {
        if (a.created > b.created) {
          return -1
        } else if (a.created < b.created) {
          return 1
        } else {
          return 0
        }
      }),
    }
  }

  private getRepositories (
    limit: number,
    offset: number,
    name: Option<string>,
  ): Promise<any> {
    console.log(offset, name)

    return this.ecrClient.send(new DescribeRepositoriesCommand({
      maxResults: limit,
    }))
  }

  private listImages (repositoryName: string) {
    return this.ecrClient.send(
      new ListImagesCommand({
        repositoryName,
      })
    )
  }

  private describeImages (repositoryName: string) {
    return this.ecrClient.send(
      new ListImagesCommand({
        repositoryName,
      })
    )
  }
}
