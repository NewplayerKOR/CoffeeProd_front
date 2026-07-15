import { apiRequest, type QueryParams } from "./client"
import type { BeanType, CoffeeProfileSummary } from "./coffee"
import type { PageResponse } from "./types"

export type RoastLevel = "LIGHT" | "MEDIUM" | "DARK"
export type ProductStatus = "ON_SALE" | "SOLD_OUT" | "HIDDEN"

export type Category = {
  id: number
  name: string
}

export type ProductListItem = {
  id: number
  categoryName: string
  coffeeProfileId: number | null
  coffeeProfileName: string | null
  sku: string
  weightGrams: number
  name: string
  price: number
  roastLevel: RoastLevel
  imageUrl: string | null
  status: ProductStatus
}

export type ProductDetail = ProductListItem & {
  categoryId: number
  coffeeProfile: CoffeeProfileSummary | null
  stockQuantity: number
  description: string | null
}

export type ProductListParams = {
  categoryId?: number
  coffeeProfileId?: number
  processingMethodId?: number
  beanType?: BeanType
  decaf?: boolean
  roastLevel?: RoastLevel
  keyword?: string
  page?: number
  size?: number
  sort?: string
}

export function getCategories() {
  return apiRequest<Category[]>("/api/v1/categories", {
    auth: false,
  })
}

export function getCategory(categoryId: number | string) {
  return apiRequest<Category>(
    `/api/v1/categories/${encodeURIComponent(categoryId)}`,
    {
      auth: false,
    }
  )
}

export function getProducts(params: ProductListParams = {}) {
  return apiRequest<PageResponse<ProductListItem>>("/api/v1/products", {
    auth: false,
    query: params as QueryParams,
  })
}

export function getProduct(productId: number | string) {
  return apiRequest<ProductDetail>(
    `/api/v1/products/${encodeURIComponent(productId)}`,
    {
      auth: false,
    }
  )
}
