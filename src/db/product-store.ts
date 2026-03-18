import { randomUUID } from 'crypto'
import type { Product, CreateProductDto, UpdateProductDto } from '../types/product'

const store = new Map<string, Product>()

export function findAll(): Promise<Product[]> {
  return Promise.resolve(Array.from(store.values()))
}

export function findById(id: string): Promise<Product | undefined> {
  return Promise.resolve(store.get(id))
}

export function create(dto: CreateProductDto): Promise<Product> {
  const product: Product = { id: randomUUID(), ...dto }
  store.set(product.id, product)
  return Promise.resolve(product)
}

export function update(id: string, dto: UpdateProductDto): Promise<Product | undefined> {
  const existing = store.get(id)
  if (!existing) return Promise.resolve(undefined)

  const updated: Product = { ...existing, ...dto }
  store.set(id, updated)
  return Promise.resolve(updated)
}

export function remove(id: string): Promise<boolean> {
  return Promise.resolve(store.delete(id))
}

export function replaceAll(): Promise<void> {
  return Promise.resolve()
}
