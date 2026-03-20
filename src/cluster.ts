import cluster from 'cluster'
import os from 'os'
import http from 'http'
import { buildApp } from './app'
import { config } from './config'
import type { Product } from './types/product'
import { findAll, findById, replaceAll, create, update, remove } from './db/product-store'
import type { ProductStore } from './routes/products/handlers'

type IpcMessage =
  | { type: 'STATE_SYNC'; products: Product[] }
  | { type: 'STATE_REQUEST' }

const WORKER_COUNT = os.availableParallelism() - 1

if (cluster.isPrimary) {
  runLoadBalancer()
} else {
  void runWorker()
}

function runLoadBalancer(): void {
  console.log(`Load balancer ${process.pid} starting ${WORKER_COUNT} workers`)

  let currentProducts: Product[] = []
  const workers: ReturnType<typeof cluster.fork>[] = []

  const attachWorker = (worker: ReturnType<typeof cluster.fork>): void => {
    worker.on('message', (msg: IpcMessage) => {
      if (msg.type === 'STATE_SYNC') {
        currentProducts = msg.products
        for (const w of workers) {
          if (w.id !== worker.id && w.isConnected()) {
            w.send(msg)
          }
        }
      }

      if (msg.type === 'STATE_REQUEST' && worker.isConnected()) {
        worker.send({ type: 'STATE_SYNC', products: currentProducts })
      }
    })
  }

  for (let i = 0; i < WORKER_COUNT; i++) {
    const workerPort = config.port + 1 + i
    const worker = cluster.fork({ WORKER_PORT: String(workerPort) })
    workers.push(worker)
    attachWorker(worker)
  }

  cluster.on('exit', (worker) => {
    console.warn(`Worker ${worker.process.pid} died — restarting`)
    const index = workers.findIndex((w) => w.id === worker.id)
    if (index !== -1) {
      const workerPort = config.port + 1 + index
      const newWorker = cluster.fork({ WORKER_PORT: String(workerPort) })
      workers[index] = newWorker
      attachWorker(newWorker)
    }
  })

  let roundRobinIndex = 0

  const loadBalancer = http.createServer((req, res) => {
    const targetPort = config.port + 1 + (roundRobinIndex % WORKER_COUNT)
    roundRobinIndex = (roundRobinIndex + 1) % WORKER_COUNT

    const options: http.RequestOptions = {
      hostname: '127.0.0.1',
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    }

    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers)
      proxyRes.pipe(res)
    })

    proxy.on('error', (err) => {
      console.error('Proxy error:', err.message)
      res.writeHead(502)
      res.end(JSON.stringify({ message: 'Bad gateway' }))
    })

    req.pipe(proxy)
  })

  loadBalancer.listen(config.port, () => {
    console.log(`Load balancer listening on port ${config.port}`)
  })
}

async function broadcastState(): Promise<void> {
  if (process.send) {
    const products = await findAll()
    const syncMsg: IpcMessage = { type: 'STATE_SYNC', products }
    process.send(syncMsg)
  }
}

async function runWorker(): Promise<void> {
  const workerPort = parseInt(process.env['WORKER_PORT'] ?? String(config.port + 1), 10)

  process.on('message', async (msg: IpcMessage) => {
    if (msg.type === 'STATE_SYNC') {
      await replaceAll(msg.products)
    }
  })

  process.send?.({ type: 'STATE_REQUEST' } satisfies IpcMessage)

  const wrappedCreate: typeof create = async (...args: Parameters<typeof create>) => {
    const result = await create(...args)
    await broadcastState()
    return result
  }

  const wrappedUpdate: typeof update = async (...args: Parameters<typeof update>) => {
    const result = await update(...args)
    if (result) await broadcastState()
    return result
  }

  const wrappedRemove: typeof remove = async (...args: Parameters<typeof remove>) => {
    const result = await remove(...args)
    if (result) await broadcastState()
    return result
  }

  const syncedStore: ProductStore = {
    findAll,
    findById,
    create: wrappedCreate,
    update: wrappedUpdate,
    remove: wrappedRemove,
  }

  const app = await buildApp({ store: syncedStore })

  try {
    await app.listen({ port: workerPort, host: '127.0.0.1' })
    console.log(`Worker ${process.pid} listening on port ${workerPort}`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
