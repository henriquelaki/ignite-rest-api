import dotenv from 'dotenv'
import { z } from 'zod'

console.log('X', process.env.NODE_ENV)
dotenv.config({ path: `.env.${process.env.NODE_ENV}` })
console.log(process.env.NODE_ENV)
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  DATABASE_URL: z.string(),
  PORT: z.number().default(3333),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error('⚠️ Invalid environment variables.', _env.error.format())
  throw new Error('Invalid environment variables.')
}

export const env = _env.data
