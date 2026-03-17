import type { FastifyReply, FastifyRequest } from 'fastify'
import { findAll } from '../../db/product-store'

export async function getAllProducts(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  reply.send(await findAll())
}

export async function getProductById(
  _req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  reply.send({});
}

export async function createProduct(
  _req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  reply.send({});
}

export async function updateProduct(
  _req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  reply.send({});
}

export async function deleteProduct(
  _req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  reply.send({});
}
