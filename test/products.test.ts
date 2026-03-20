import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app.js'
import { create as storeCreate, replaceAll } from '../src/db/product-store.js'

let app: FastifyInstance

beforeAll(async () => {
  process.env['PORT'] = '4000'
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

beforeEach(async () => {
  await replaceAll([])
})

const validProduct = {
  name: 'Mechanical Keyboard',
  description: 'Tactile switches, RGB backlight',
  price: 129.99,
  category: 'electronics',
  inStock: true,
}

describe('GET /api/products', () => {
  it('returns 200 with empty array when no products exist', async () => {
    const res = await supertest(app.server).get('/api/products')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns 200 with all products after creation', async () => {
    await storeCreate(validProduct)
    await storeCreate({ ...validProduct, name: 'Mouse' })

    const res = await supertest(app.server).get('/api/products')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })
})

describe('POST /api/products', () => {
  it('creates a product and returns 201 with the new record', async () => {
    const res = await supertest(app.server)
      .post('/api/products')
      .send(validProduct)
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject(validProduct)
    expect(res.body.id).toBeDefined()
    expect(typeof res.body.id).toBe('string')
  })

  it('returns 400 when required field is missing', async () => {
    const { name: _name, ...withoutName } = validProduct

    const res = await supertest(app.server)
      .post('/api/products')
      .send(withoutName)
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(400)
  })

  it('returns 400 when price is zero', async () => {
    const res = await supertest(app.server)
      .post('/api/products')
      .send({ ...validProduct, price: 0 })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(400)
  })

  it('returns 400 when price is negative', async () => {
    const res = await supertest(app.server)
      .post('/api/products')
      .send({ ...validProduct, price: -10 })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(400)
  })
})

describe('GET /api/products/:productId', () => {
  it('returns 200 with the product when it exists', async () => {
    const created = await storeCreate(validProduct)

    const res = await supertest(app.server).get(`/api/products/${created.id}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject(validProduct)
    expect(res.body.id).toBe(created.id)
  })

  it('returns 400 when productId is not a valid UUID', async () => {
    const res = await supertest(app.server).get('/api/products/not-a-uuid')

    expect(res.status).toBe(400)
  })

  it('returns 404 when product does not exist', async () => {
    const res = await supertest(app.server).get(
      '/api/products/00000000-0000-0000-0000-000000000000',
    )

    expect(res.status).toBe(404)
  })
})

describe('PUT /api/products/:productId', () => {
  it('updates the product and returns 200 with updated record', async () => {
    const created = await storeCreate(validProduct)
    const update = { name: 'Updated Keyboard', price: 149.99 }

    const res = await supertest(app.server)
      .put(`/api/products/${created.id}`)
      .send(update)
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(created.id)
    expect(res.body.name).toBe('Updated Keyboard')
    expect(res.body.price).toBe(149.99)
    expect(res.body.category).toBe(validProduct.category)
  })

  it('returns 400 when productId is not a valid UUID', async () => {
    const res = await supertest(app.server)
      .put('/api/products/not-a-uuid')
      .send({ name: 'Test' })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(400)
  })

  it('returns 404 when product does not exist', async () => {
    const res = await supertest(app.server)
      .put('/api/products/00000000-0000-0000-0000-000000000000')
      .send({ name: 'Ghost' })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/products/:productId', () => {
  it('deletes the product and returns 204', async () => {
    const created = await storeCreate(validProduct)

    const res = await supertest(app.server).delete(`/api/products/${created.id}`)

    expect(res.status).toBe(204)
  })

  it('returns 400 when productId is not a valid UUID', async () => {
    const res = await supertest(app.server).delete('/api/products/not-a-uuid')

    expect(res.status).toBe(400)
  })

  it('returns 404 when product does not exist', async () => {
    const res = await supertest(app.server).delete(
      '/api/products/00000000-0000-0000-0000-000000000000',
    )

    expect(res.status).toBe(404)
  })
})

describe('Full CRUD lifecycle', () => {
  it('creates, reads, updates, deletes a product in sequence', async () => {
    const createRes = await supertest(app.server)
      .post('/api/products')
      .send(validProduct)
      .set('Content-Type', 'application/json')

    expect(createRes.status).toBe(201)
    const { id } = createRes.body as { id: string }

    const getRes = await supertest(app.server).get(`/api/products/${id}`)
    expect(getRes.status).toBe(200)
    expect(getRes.body.id).toBe(id)

    const updateRes = await supertest(app.server)
      .put(`/api/products/${id}`)
      .send({ name: 'Pro Keyboard', price: 199.99 })
      .set('Content-Type', 'application/json')

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.id).toBe(id)
    expect(updateRes.body.name).toBe('Pro Keyboard')

    const deleteRes = await supertest(app.server).delete(`/api/products/${id}`)
    expect(deleteRes.status).toBe(204)

    const afterDeleteRes = await supertest(app.server).get(`/api/products/${id}`)
    expect(afterDeleteRes.status).toBe(404)
  })
})

describe('Unknown routes', () => {
  it('returns 404 for non-existing routes', async () => {
    const res = await supertest(app.server).get('/non/existing/route')

    expect(res.status).toBe(404)
    expect(res.body.message).toBeDefined()
  })
})
