import type { FastifyReply, FastifyRequest } from 'fastify'
import { validate as isUuid } from 'uuid'
import type { CreateProductDto, UpdateProductDto } from '../../types/product'
import type { Product } from '../../types/product'

type ProductIdParams = { productId: string }

export type ProductStore = {
  findAll: () => Promise<Product[]>
  findById: (id: string) => Promise<Product | undefined>
  create: (dto: CreateProductDto) => Promise<Product>
  update: (id: string, dto: UpdateProductDto) => Promise<Product | undefined>
  remove: (id: string) => Promise<boolean>
}

export function createProductHandlers(store: ProductStore): {
  getAllProducts: (_req: FastifyRequest, reply: FastifyReply) => Promise<void>
  getProductById: (
    req: FastifyRequest<{ Params: ProductIdParams }>,
    reply: FastifyReply,
  ) => Promise<void>
  createProduct: (
    req: FastifyRequest<{ Body: CreateProductDto }>,
    reply: FastifyReply,
  ) => Promise<void>
  updateProduct: (
    req: FastifyRequest<{ Params: ProductIdParams; Body: UpdateProductDto }>,
    reply: FastifyReply,
  ) => Promise<void>
  deleteProduct: (
    req: FastifyRequest<{ Params: ProductIdParams }>,
    reply: FastifyReply,
  ) => Promise<void>
} {
  async function getAllProducts(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.send(await store.findAll())
  }

  async function getProductById(
    req: FastifyRequest<{ Params: ProductIdParams }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { productId } = req.params
    if (!isUuid(productId)) {
      return reply.badRequest(`productId must be a valid UUID`)
    }
    const product = await store.findById(productId)
    if (!product) {
      return reply.notFound(`Product with id ${productId} not found`)
    }
    reply.send(product)
  }

  async function createProduct(
    req: FastifyRequest<{ Body: CreateProductDto }>,
    reply: FastifyReply,
  ): Promise<void> {
    const product = await store.create(req.body)
    reply.status(201).send(product)
  }

  async function updateProduct(
    req: FastifyRequest<{ Params: ProductIdParams; Body: UpdateProductDto }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { productId } = req.params
    if (!isUuid(productId)) {
      return reply.badRequest(`productId must be a valid UUID`)
    }
    const updated = await store.update(productId, req.body)
    if (!updated) {
      return reply.notFound(`Product with id ${productId} not found`)
    }
    reply.send(updated)
  }

  async function deleteProduct(
    req: FastifyRequest<{ Params: ProductIdParams }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { productId } = req.params
    if (!isUuid(productId)) {
      return reply.badRequest(`productId must be a valid UUID`)
    }
    const deleted = await store.remove(productId)
    if (!deleted) {
      return reply.notFound(`Product with id ${productId} not found`)
    }
    reply.status(204).send()
  }

  return {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
