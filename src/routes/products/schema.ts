import type { FastifySchema } from 'fastify'

const productBodySchema = {
  type: 'object',
  required: ['name', 'description', 'price', 'category', 'inStock'],
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },
    price: { type: 'number', exclusiveMinimum: 0 },
    category: { type: 'string', minLength: 1 },
    inStock: { type: 'boolean' },
  },
  additionalProperties: false,
} as const

const updateBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },
    price: { type: 'number', exclusiveMinimum: 0 },
    category: { type: 'string', minLength: 1 },
    inStock: { type: 'boolean' },
  },
  additionalProperties: false,
} as const

const productIdParamsSchema = {
  type: 'object',
  required: ['productId'],
  properties: {
    productId: { type: 'string' },
  },
} as const

export const getAllSchema: FastifySchema = {
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          category: { type: 'string' },
          inStock: { type: 'boolean' },
        },
      },
    },
  },
}

export const getByIdSchema: FastifySchema = {
  params: productIdParamsSchema,
}

export const createSchema: FastifySchema = {
  body: productBodySchema,
}

export const updateSchema: FastifySchema = {
  params: productIdParamsSchema,
  body: updateBodySchema,
}

export const deleteSchema: FastifySchema = {
  params: productIdParamsSchema,
}
