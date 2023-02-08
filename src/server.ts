import fastify from 'fastify'
import { env } from './env'
import { transactionRoutes } from './routes/transactions'
import cookie from '@fastify/cookie'
import { initiateLogLevel } from './middleware/initiate-log-level'

const app = fastify()

app.addHook('preHandler', initiateLogLevel)

app.register(cookie)

app.register(transactionRoutes, { prefix: 'transactions' })

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log(`Server started on port ${env.PORT}`)
  })
