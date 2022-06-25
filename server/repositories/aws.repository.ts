import prettyBytes from 'pretty-bytes';
import { ECRClient, DescribeRepositoriesCommand, ListImagesCommand, DescribeImagesCommand } from '@aws-sdk/client-ecr';
import { ContainerRepository, RegistryApiRepository } from '../gateways/registry-api';

export type AwsRepositoryConfig = { accessKey: string, secretKey: string, region: string }

export class AwsRepository implements RegistryApiRepository {
  private ecrClient: ECRClient;

  constructor(data: AwsRepositoryConfig) {
    this.ecrClient = new ECRClient({
      credentials: {
        accessKeyId: data.accessKey,
        secretAccessKey: data.secretKey,
      },
      region: data.region,
    });
  }

  async listRepositories(): Promise<ContainerRepository[]> {
    let { repositories } = await this.ecrClient.send(new DescribeRepositoriesCommand({}));

    const repositoriesAws = await Promise.all(repositories!.map(async ({
      repositoryName,
      repositoryUri,
    }) => {
      const {
        imageIds,
      } = await this.ecrClient.send(new ListImagesCommand({
        repositoryName,
      }));

      return {
        name: repositoryName ?? "",
        countOfTags: imageIds!.length ?? 0,
        url: repositoryUri ?? "",
      };
    }));

    return repositoriesAws!;
  }

  async listRepositoriesTags(repositoryName: string): Promise<any> {
    const { imageDetails } = await this.ecrClient.send(new DescribeImagesCommand({ repositoryName }));

    const digests = imageDetails!.map((i) => {
      return {
        name: repositoryName,
        digest: i?.imageDigest?.replace('sha256:', '').slice(7, 19),
        fullDigest: i.imageDigest,
        created: i.imagePushedAt,
        size: prettyBytes(i?.imageSizeInBytes || 0),
      };
    });

    const finalDigests = new Map();
    digests.forEach(({ name, digest, size, created, fullDigest }) => {
      if (finalDigests.has(digest)) {
        finalDigests.set(digest, {
          name: digest,
          tags: [...finalDigests.get(digest).tags, name],
          size,
          created,
          fullDigest,
        });
      } else {
        finalDigests.set(digest, { name: digest, tags: [name], size, created, fullDigest });
      }
    });

    return {
      noTag: false,
      name: repositoryName,
      digests: Array.from(finalDigests.values())
        .sort((a, b) => {
          if (a.created > b.created) {
            return -1;
          } else if (a.created > b.created) {
            return 1;
          } else {
            return 0;
          }
        }),
    };
  }
}
