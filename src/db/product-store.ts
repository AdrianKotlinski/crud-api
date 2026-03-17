import type { Product } from '../types/product'

const store = new Map<string, Product>()

export function findAll(): Promise<Product[]> {
  return Promise.resolve(Array.from(store.values()))
}

export function findById(): Promise<Product | undefined> {
  return Promise.resolve({} as Product)
}

export function create(): Promise<Product> {
  return Promise.resolve({} as Product)
}

export function update(): Promise<Product | undefined> {
  return Promise.resolve({} as Product)
}

export function remove(): Promise<boolean> {
  return Promise.resolve(true)
}

export function replaceAll(): Promise<void> {
  return Promise.resolve()
}
