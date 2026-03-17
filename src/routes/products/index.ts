import type { FastifyInstance } from 'fastify'
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from './handlers'
import {
  getAllSchema,
  getByIdSchema,
  createSchema,
  updateSchema,
  deleteSchema,
} from './schema'

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.get('/products', { schema: getAllSchema }, getAllProducts)
  app.get('/products/:productId', { schema: getByIdSchema }, getProductById)
  app.post('/products', { schema: createSchema }, createProduct)
  app.put('/products/:productId', { schema: updateSchema }, updateProduct)
  app.delete('/products/:productId', { schema: deleteSchema }, deleteProduct)
}
