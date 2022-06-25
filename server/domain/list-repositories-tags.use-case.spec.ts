import { beforeEach, describe, expect, it } from 'vitest';
import { AwsRepository, AwsRepositoryConfig } from '../repositories/aws.repository';
import { ListRepositoryTagsUseCase } from './list-repositories-tags.use-case';

let useCase: ListRepositoryTagsUseCase;

describe('list-repositories.use-case', () => {
  describe('with an AWS repository', () => {
    beforeEach(() => {
      const data: AwsRepositoryConfig = {
        accessKey: process.env.AWS_ACCESS_KEY ?? "",
        secretKey: process.env.AWS_SECRET_KEY ?? "",
        region: "eu-west-3"
      };

      useCase = new ListRepositoryTagsUseCase(new AwsRepository(data));
    });

    it('should list the tag of the repository called test', async () => {
      expect(await useCase.execute("test")).toEqual(
        {
          name: "test",
          noTag: false,
          digests: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              size: expect.any(String),
              tags: ["test"],
              created: expect.any(Date),
              fullDigest: expect.any(String),
            })
          ])
        }
      );
    });
  });
});
