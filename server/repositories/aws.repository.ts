import { Option } from '@swan-io/boxed'
import prettyBytes from 'pretty-bytes'
import { ECR, DescribeRepositoriesCommand, ListImagesCommand, DescribeImagesCommand } from '@aws-sdk/client-ecr'
import { execa } from 'execa'
import { ContainerRepository, RegistryApiRepository } from '../gateways/registry-api.gateway'

export type AwsRepositoryConfig = {
  accessKey: string,
  secretKey: string,
  region: string,
  useCLI: boolean
}

export class AwsRepository implements RegistryApiRepository {
  private ecrClient: ECR
  private useCLI: boolean

  constructor (data: AwsRepositoryConfig) {
    this.ecrClient = new ECR({
      credentials: {
        accessKeyId: data.accessKey,
        secretAccessKey: data.secretKey,
      },
      region: data.region,
    })

    this.useCLI = data.useCLI
  }

  async listRepositories (limit: number, offset: number, name: Option<string>): Promise<ContainerRepository[]> {
    const { repositories } = await this.getRepositories(limit, offset, name)

    const arrayImageIds = await Promise.all(
      repositories.map(async (repository: any) => {
        return (await this.listImages(repository.repositoryName)).imageIds
      })
    )

    return repositories.map(({ repositoryName, repositoryUri }: any, index: number) => ({
      name: repositoryName ?? '',
      countOfTags: arrayImageIds[index]?.length ?? 0,
      url: repositoryUri ?? '',
    }))
  }

  async listRepositoriesTags (repositoryName: string): Promise<any> {
    let digests

    if (this.useCLI) {
      const a = await this.describeImages(repositoryName)

      // @ts-ignore
      digests = a.imageDetails.map((i) => {
        return {
          name: i.imageTags,
          digest: i?.imageDigest?.replace('sha256:', '').slice(7, 19),
          fullDigest: i.imageDigest,
          created: i.imagePushedAt ?? new Date(),
          size: prettyBytes(i?.imageSizeInBytes || 0),
        }
      })
    } else {
      const { imageDetails } = await this.ecrClient.send(new DescribeImagesCommand({ repositoryName }))

      digests = imageDetails!.map((i) => {
        return {
          name: repositoryName,
          digest: i?.imageDigest?.replace('sha256:', '').slice(7, 19),
          fullDigest: i.imageDigest,
          created: i.imagePushedAt,
          size: prettyBytes(i?.imageSizeInBytes || 0),
        }
      })
    }

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
        finalDigests.set(digest, { name: digest, tags: [name].flat(), size, created, fullDigest })
      }
    })

    return {
      noTag: false,
      name: repositoryName,
      digests: Array.from(finalDigests.values())
        .sort((a, b) => {
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

  private async getRepositories (limit: number, offset: number, name: Option<string>): Promise<any> {
    if (this.useCLI) {
      const { stdout } = await execa('aws', ['ecr', 'describe-repositories'])
      const { repositories } = JSON.parse(stdout)

      return {
        repositories: repositories
          .sort((a: { repositoryName: string }, b: { repositoryName: string }) => {
            if (a.repositoryName > b.repositoryName) {
              return 1
            } else if (a.repositoryName < b.repositoryName) {
              return -1
            } else {
              return 0
            }
          })
          .filter((data: any) => {
            if (name.isSome()) {
              return data.repositoryName.includes(name.get())
            }

            return true
          })
          .slice(offset, offset + limit)
      }
    }

    return this.ecrClient.send(new DescribeRepositoriesCommand({}))
  }

  private async listImages (repositoryName: string) {
    if (this.useCLI) {
      const { stdout } = await execa('aws', ['ecr', 'list-images', '--repository-name', repositoryName])
      return JSON.parse(stdout)
    }

    return this.ecrClient.send(new ListImagesCommand({
      repositoryName,
    }))
  }

  private async describeImages (repositoryName: string) {
    if (this.useCLI) {
      const { stdout } = await execa('aws', ['ecr', 'describe-images', '--repository-name', repositoryName])
      return JSON.parse(stdout)
    }

    return this.ecrClient.send(new ListImagesCommand({
      repositoryName,
    }))
  }
}
