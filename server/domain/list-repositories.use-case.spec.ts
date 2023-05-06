import { beforeEach, describe, expect, it } from 'vitest'
import { Option } from '@swan-io/boxed'
import { GithubRepository } from '../repositories/github.repository'
import { AwsRepository } from '../repositories/aws.repository'
import { DockerhubRepository } from '../repositories/dockerhub.repository'
import { ListRepositoryUseCase } from './list-repositories.use-case'

let useCase: ListRepositoryUseCase

describe('list-repositories.use-case', () => {
  beforeEach(() => {
    process.env.AWS_SESSION_TOKEN = ''
    process.env.AWS_SECRET_ACCESS_KEY = ''
    process.env.AWS_ACCESS_KEY_ID = ''
  })

  describe('with an AWS repository', () => {
    beforeEach(() => {
      useCase = new ListRepositoryUseCase(
        new AwsRepository({
          accessKey: process.env.AWS_ACCESS_KEY_ID ?? '',
          region: 'eu-west-3',
          secretKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
          sessionToken: process.env.AWS_SESSION_TOKEN ?? '',
        })
      )
    })

    it('should list the repositories', async () => {
      expect(
        await useCase.execute({ limit: 2, offset: 0, name: Option.None() })
      ).toEqual([
        {
          countOfTags: 1,
          name: 'test',
          url: '615276192617.dkr.ecr.eu-west-3.amazonaws.com/test',
        },
      ])
    })
  })

  describe('with a Github repository', () => {
    beforeEach(() => {
      useCase = new ListRepositoryUseCase(
        new GithubRepository({
          nickname: 'Tchoupinax',
          token: process.env.GITHUB_TOKEN ?? '',
        })
      )
    })

    it('should list the repositories', async () => {
      expect(
        await useCase.execute({ limit: 2, offset: 0, name: Option.None() })
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            countOfTags: expect.any(Number),
            url: expect.any(String),
          }),
        ])
      )
    })
  })

  describe('with a Dockerhub repository', () => {
    beforeEach(() => {
      useCase = new ListRepositoryUseCase(
        new DockerhubRepository({
          username: 'tchoupinax',
          password: process.env.DOCKERHUB_TOKEN ?? '',
        })
      )
    })

    it('should list the repositories', async () => {
      expect(
        await useCase.execute({ limit: 2, offset: 0, name: Option.None() })
      ).toEqual(
        // @ts-ignore
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            countOfTags: expect.any(Number),
          }),
        ])
      )
    })
  })
})
