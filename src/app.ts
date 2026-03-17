import Fastify, { type FastifyInstance } from 'fastify'
import sensible from '@fastify/sensible'
import { productRoutes } from './routes/products/index'

export async function buildApp(): Promise<FastifyInstance> {
  try {
    const app = Fastify({
      logger: process.env.NODE_ENV !== 'test',
    })

    await app.register(sensible)
    await app.register(productRoutes, { prefix: '/api' })

    app.setNotFoundHandler((_req, reply) => {
      reply.status(404).send({ message: 'Route not found' })
    })

    app.setErrorHandler((error: Error & { statusCode?: number }, _req, reply) => {
      const statusCode = error.statusCode ?? 500
      const message =
        statusCode >= 500 ? 'Internal server error' : (error.message ?? 'An error occurred')
      reply.status(statusCode).send({ message })
    })

    return app;
  }
  catch (err) {
    console.error('Error building app:', err)
    process.exit(1);
  }

}
