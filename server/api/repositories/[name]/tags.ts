import { defineEventHandler, useCookies } from 'h3';
import { ListRepositoryTagsUseCase } from '../../../domain/list-repositories-tags.use-case';
import { AwsRepository, AwsRepositoryConfig } from "../../../repositories/aws.repository";

export default defineEventHandler(async (request) => {
  let listRepositoryTagsUseCase: ListRepositoryTagsUseCase;

  const {
    'fuzzy-engine-provider': provider,
    'fuzzy-engine-aws-ecr': credentials,
  } = useCookies(request);

  if (true || provider === 'aws-ecr') {
    const { secretKey, accessKey } = {};
    // const { secretKey, accessKey } = JSON.parse(Buffer.from(credentials, 'base64').toString('ascii'));

    const awsConfig: AwsRepositoryConfig = {
      accessKey: accessKey ?? process.env.AWS_ACCESS_KEY,
      secretKey: secretKey ?? process.env.AWS_SECRET_KEY,
      region: "eu-west-3"
    };

    listRepositoryTagsUseCase = new ListRepositoryTagsUseCase(new AwsRepository(awsConfig));
  }

  return listRepositoryTagsUseCase.execute(request.context.params.name);
});
