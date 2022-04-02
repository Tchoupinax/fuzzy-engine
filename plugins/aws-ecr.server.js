import { ECRClient } from '@aws-sdk/client-ecr';
import cookieparser from 'cookieparser';

export default ({ req }, inject) => {
  const { cookie } = req.headers;

  if (!cookie) {
    return;
  }

  const { 'fuzzy-engine-aws-ecr': awsEcr } = cookieparser.parse(req.headers.cookie);

  if (!awsEcr) {
    return;
  }

  const data = JSON.parse(Buffer.from(awsEcr, 'base64').toString('utf-8'));
  const client = new ECRClient({
    credentials: {
      accessKeyId: data.accessKey,
      secretAccessKey: data.secretKey,
    },
    region: data.region,
  });

  inject('aws', client);
};
