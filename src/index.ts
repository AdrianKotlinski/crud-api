import { buildApp } from './app'
import { config } from './config'

void (async (): Promise<void> => {
  const app = await buildApp();
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' })
    console.log(`Server running on port ${config.port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
})()
