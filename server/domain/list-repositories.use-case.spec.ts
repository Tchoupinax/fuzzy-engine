import { beforeEach, describe, expect, it } from 'vitest';
import { GithubRepository } from '../repositories/github.repository';
import { AwsRepository, AwsRepositoryConfig } from '../repositories/aws.repository';
import { ListRepositoryUseCase } from './list-repositories.use-case';
import { DockerhubRepository } from '../repositories/dockerhub.repository';

let useCase: ListRepositoryUseCase;

describe.skip('list-repositories.use-case', () => {
  describe('with an AWS repository', () => {
    beforeEach(() => {
      useCase = new ListRepositoryUseCase(
        new AwsRepository({
          accessKey: process.env.AWS_ACCESS_KEY ?? "",
          secretKey: process.env.AWS_SECRET_KEY ?? "",
          region: "eu-west-3"
        }),
      );
    });

    it('should list the repositories', async () => {
      expect(await useCase.execute()).toEqual([
        { countOfTags: 1, name: "test", url: "615276192617.dkr.ecr.eu-west-3.amazonaws.com/test" }
      ]);
    });
  });

  describe('with a Github repository', () => {
    beforeEach(() => {
      useCase = new ListRepositoryUseCase(
        new GithubRepository({
          nickname: 'Tchoupinax',
          token: process.env.GITHUB_TOKEN ?? ""
        }),
      );
    });

    it('should list the repositories', async () => {
      expect(await useCase.execute()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            countOfTags: expect.any(Number),
            url: expect.any(String),
          })
        ])
      );
    });
  });

  describe('with a Dockerhub repository', () => {
    beforeEach(() => {
      useCase = new ListRepositoryUseCase(
        new DockerhubRepository({
          username: 'tchoupinax',
          password: process.env.DOCKERHUB_TOKEN ?? ""
        }),
      );
    });

    it('should list the repositories', async () => {
      expect(await useCase.execute()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            countOfTags: expect.any(Number),
          })
        ])
      );
    });
  });
});
