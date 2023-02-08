import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { knex } from '../src/database'
import { randomUUID } from 'node:crypto'

const testId = randomUUID()
const title = `Test transaction-${testId}`

describe('Transaction routes', () => {
  beforeAll(() => {
    return app.ready()
  })

  afterEach(async () => {
    await knex('transactions').delete().where('title', title)
  })

  afterAll(() => {
    return app.close()
  })

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title,
        amount: 100,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to get a list of transactions with authentication', async () => {
    const transaction = {
      title,
      amount: 100,
      type: 'credit',
    }

    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send(transaction)
    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionResponse.body?.transactions).toEqual([
      expect.objectContaining({ title, amount: 100 }),
    ])
  })

  it('should not be able to get a list of transactions without authentication', async () => {
    await request(app.server).get('/transactions').expect(401)
  })
})
