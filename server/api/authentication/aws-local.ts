import { defineEventHandler } from 'h3'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'
import { logger } from '../../tools/logger'

export default defineEventHandler(async () => {
  logger.info('Handle /authentication/aws-local')

  if (
    process.env.AWS_SESSION_TOKEN &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  ) {
    const client = new STSClient({})
    const command = new GetCallerIdentityCommand({})
    const response = await client.send(command)

    return {
      identity: response.UserId,
      connected: true
    }
  }

  return {
    identity: '',
    connected: false
  }
})
