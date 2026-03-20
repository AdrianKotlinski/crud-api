import type { FastifyInstance } from 'fastify'
import * as defaultStore from '../../db/product-store'
import { createProductHandlers } from './handlers'
import type { ProductStore } from './handlers'
import {
  getAllSchema,
  getByIdSchema,
  createSchema,
  updateSchema,
  deleteSchema,
} from './schema'

type ProductRoutesOptions = {
  store?: ProductStore
}

export async function productRoutes(
  app: FastifyInstance,
  options: ProductRoutesOptions,
): Promise<void> {
  const store = options.store ?? defaultStore
  const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } =
    createProductHandlers(store)

  app.get('/products', { schema: getAllSchema }, getAllProducts)
  app.get('/products/:productId', { schema: getByIdSchema }, getProductById)
  app.post('/products', { schema: createSchema }, createProduct)
  app.put('/products/:productId', { schema: updateSchema }, updateProduct)
  app.delete('/products/:productId', { schema: deleteSchema }, deleteProduct)
}
