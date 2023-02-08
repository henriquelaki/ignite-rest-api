import fastify from 'fastify'
import { transactionRoutes } from './routes/transactions'
import cookie from '@fastify/cookie'
import { initiateLogLevel } from './middleware/initiate-log-level'

export const app = fastify()

app.addHook('preHandler', initiateLogLevel)

app.register(cookie)

app.register(transactionRoutes, { prefix: 'transactions' })
