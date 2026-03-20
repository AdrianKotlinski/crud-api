import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/cluster.ts'],
  format: ['cjs'],
  target: 'es2022',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
})
