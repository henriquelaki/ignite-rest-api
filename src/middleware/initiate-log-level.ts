import { FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../env'

export async function initiateLogLevel(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  env.NODE_ENV === 'development' &&
    console.log(
      `[${request.method}] - ${new Date().toISOString()} - ${request.url} [${
        request.ip
      }]`,
    )
}
