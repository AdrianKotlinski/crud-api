import type { FastifyReply, FastifyRequest } from 'fastify'
import { validate as isUuid } from 'uuid'
import { findAll, findById, create, update, remove } from '../../db/product-store'
import type { CreateProductDto, UpdateProductDto } from '../../types/product'

type ProductIdParams = { productId: string }

export async function getAllProducts(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  reply.send(await findAll())
}

export async function getProductById(
  req: FastifyRequest<{ Params: ProductIdParams }>,
  reply: FastifyReply,
): Promise<void> {
  const { productId } = req.params
  if (!isUuid(productId)) {
    return reply.badRequest(`productId must be a valid UUID`)
  }
  const product = await findById(productId)
  if (!product) {
    return reply.notFound(`Product with id ${productId} not found`)
  }
  reply.send(product)
}

export async function createProduct(
  req: FastifyRequest<{ Body: CreateProductDto }>,
  reply: FastifyReply,
): Promise<void> {
  const product = await create(req.body)
  reply.status(201).send(product)
}

export async function updateProduct(
  req: FastifyRequest<{ Params: ProductIdParams; Body: UpdateProductDto }>,
  reply: FastifyReply,
): Promise<void> {
  const { productId } = req.params
  if (!isUuid(productId)) {
    return reply.badRequest(`productId must be a valid UUID`)
  }
  const updated = await update(productId, req.body)
  if (!updated) {
    return reply.notFound(`Product with id ${productId} not found`)
  }
  reply.send(updated)
}

export async function deleteProduct(
  req: FastifyRequest<{ Params: ProductIdParams }>,
  reply: FastifyReply,
): Promise<void> {
  const { productId } = req.params
  if (!isUuid(productId)) {
    return reply.badRequest(`productId must be a valid UUID`)
  }
  const deleted = await remove(productId)
  if (!deleted) {
    return reply.notFound(`Product with id ${productId} not found`)
  }
  reply.status(204).send()
}
