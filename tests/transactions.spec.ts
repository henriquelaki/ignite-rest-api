import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  expect,
  beforeEach,
} from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'
import { randomUUID } from 'node:crypto'

const testId = randomUUID()
const title = `Test transaction-${testId}`

describe('Transaction routes', () => {
  beforeAll(() => {
    return app.ready()
  })

  beforeEach(async () => {
    execSync('npm run knex -- migrate:latest')
  })

  afterEach(async () => {
    execSync('npm run knex -- migrate:rollback --all')
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

  it('should be able to get an unique transaction with authentication', async () => {
    const firstTransaction = {
      title,
      amount: 100,
      type: 'credit',
    }

    const secondTransaction = {
      title: `Other ${title}`,
      amount: 200,
      type: 'credit',
    }

    const createFirstTransactionResponse = await request(app.server)
      .post('/transactions')
      .send(firstTransaction)

    const createSecondTransactionResponse = await request(app.server)
      .post('/transactions')
      .send(secondTransaction)

    await request(app.server).post('/transactions').send(secondTransaction)

    const cookiesFromFirstTransaction =
      createFirstTransactionResponse.get('Set-Cookie')

    const cookiesFromSecondTransaction =
      createSecondTransactionResponse.get('Set-Cookie')

    const listOfTransactionsFromFirstSession = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookiesFromFirstTransaction)

    const firstTransactionId =
      listOfTransactionsFromFirstSession.body.transactions[0].id

    const listOfTransactionsFromSecondSession = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookiesFromSecondTransaction)

    const secondTransactionId =
      listOfTransactionsFromSecondSession.body.transactions[0].id

    const getTransactionFromFirstSessionResponse = await request(app.server)
      .get(`/transactions/${firstTransactionId}`)
      .set('Cookie', cookiesFromFirstTransaction)
      .expect(200)

    expect(getTransactionFromFirstSessionResponse.body?.transaction).toEqual(
      expect.objectContaining({ title, amount: 100 }),
    )

    const getTransactionFromSecondSessionResponse = await request(app.server)
      .get(`/transactions/${secondTransactionId}`)
      .set('Cookie', cookiesFromSecondTransaction)
      .expect(200)

    expect(getTransactionFromSecondSessionResponse.body?.transaction).toEqual(
      expect.objectContaining({ title: `Other ${title}`, amount: 200 }),
    )
  })

  it('should not be able to get an unique transaction without authentication', async () => {
    await request(app.server).get(`/transactions/${randomUUID()}`).expect(401)
  })

  it('should not be able to get an unique transaction that does not exists', async () => {
    const transaction = {
      title,
      amount: 100,
      type: 'credit',
    }

    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send(transaction)

    const cookies = createTransactionResponse.get('Set-Cookie')

    await request(app.server)
      .get(`/transactions/${randomUUID()}`)
      .set('Cookie', cookies)
      .expect(404)
  })

  it('should not be able to get an unique transaction that does not belongs to the user', async () => {
    const transaction = {
      title,
      amount: 100,
      type: 'credit',
    }

    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send(transaction)

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listOfTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)

    const transactionId = listOfTransactions.body.transactions[0].id

    const transactionSessionId = createTransactionResponse
      .get('Set-Cookie')[0]
      .split(';')[0]
      .split('=')[1]

    cookies[0] = cookies[0].replace(transactionSessionId, randomUUID())

    await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(404)
  })
  it('should be able to get a summary of transactions with authentication', async () => {
    const creditTransaction = {
      title,
      amount: 100,
      type: 'credit',
    }

    const debitTransaction = {
      title,
      amount: 25,
      type: 'debit',
    }

    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send(creditTransaction)

    const cookies = createTransactionResponse.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .send(debitTransaction)
      .set('Cookie', cookies)

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body?.summary).toEqual({ amount: 75 })
  })

  it('should not be able to get a summary of transactions without authentication', async () => {
    await request(app.server).get('/transactions/summary').expect(401)
  })
})
