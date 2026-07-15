import { apiRequest, type QueryParams } from "./client"
import type {
  Category,
  ProductDetail,
  ProductListItem,
  ProductStatus,
  RoastLevel,
} from "./catalog"
import type { Member, MemberGrade, MemberStatus } from "./auth"
import type { OrderDetail, OrderStatus } from "./order"
import type { PageResponse } from "./types"

export type AdminCategoryRequest = {
  name: string
}

export type AdminProductRequest = {
  categoryId: number
  coffeeProfileId: number | null
  sku: string
  weightGrams: number
  name: string
  price: number
  stockQuantity: number
  roastLevel: RoastLevel
  description: string
  image_url: string
}

export type AdminProductStatusRequest = {
  status: ProductStatus
}

export type AdminProductStockRequest = {
  quantity: number
}

export type AdminProductListParams = {
  categoryId?: number
  roastLevel?: RoastLevel
  status?: ProductStatus
  keyword?: string
  page?: number
  size?: number
  sort?: string
}

export type AdminMemberListParams = {
  includeWithdrawn?: boolean
  page?: number
  size?: number
  sort?: string
}

export type AdminMemberGradeRequest = {
  grade: MemberGrade
}

export type AdminMemberMutableStatus = Exclude<MemberStatus, "WITHDRAWN">

export type AdminMemberStatusRequest = {
  status: AdminMemberMutableStatus
}

export type AdminOrderListItem = {
  orderId: number
  memberId: number
  memberEmail: string
  status: OrderStatus
  totalPrice: number
  usedMileage: number
  orderDate: string
  trackingNo: string | null
  itemCount: number
  firstProductName: string
}

export type AdminOrderListParams = {
  page?: number
  size?: number
  sort?: string
}

export type AdminOrderStatusRequest = {
  status: OrderStatus
  trackingNo?: string
}

export function getAdminMembers(params: AdminMemberListParams = {}) {
  return apiRequest<PageResponse<Member>>("/api/v1/admin/members", {
    query: params as QueryParams,
  })
}

export function getAdminMember(memberId: number | string) {
  return apiRequest<Member>(
    `/api/v1/admin/members/${encodeURIComponent(memberId)}`
  )
}

export function updateAdminMemberGrade(
  memberId: number | string,
  payload: AdminMemberGradeRequest
) {
  return apiRequest<Member>(
    `/api/v1/admin/members/${encodeURIComponent(memberId)}/grade`,
    {
      method: "PATCH",
      body: payload,
    }
  )
}

export function updateAdminMemberStatus(
  memberId: number | string,
  payload: AdminMemberStatusRequest
) {
  return apiRequest<Member>(
    `/api/v1/admin/members/${encodeURIComponent(memberId)}/status`,
    {
      method: "PATCH",
      body: payload,
    }
  )
}

export function getAdminOrders(params: AdminOrderListParams = {}) {
  return apiRequest<PageResponse<AdminOrderListItem>>("/api/v1/admin/orders", {
    query: params as QueryParams,
  })
}

export function updateAdminOrderStatus(
  orderId: number | string,
  payload: AdminOrderStatusRequest
) {
  return apiRequest<OrderDetail>(
    `/api/v1/admin/orders/${encodeURIComponent(orderId)}/status`,
    {
      method: "PATCH",
      body: payload,
    }
  )
}

export function deleteAdminCategory(categoryId: number | string) {
  return apiRequest<null>(
    `/api/v1/admin/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "DELETE",
    }
  )
}

export function createAdminCategory(payload: AdminCategoryRequest) {
  return apiRequest<Category>("/api/v1/admin/categories", {
    method: "POST",
    body: payload,
  })
}

export function updateAdminCategory(
  categoryId: number | string,
  payload: AdminCategoryRequest
) {
  return apiRequest<Category>(
    `/api/v1/admin/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "PUT",
      body: payload,
    }
  )
}

export function createAdminProduct(payload: AdminProductRequest) {
  return apiRequest<ProductDetail>("/api/v1/admin/products", {
    method: "POST",
    body: payload,
  })
}

export function getAdminProducts(params: AdminProductListParams = {}) {
  return apiRequest<PageResponse<ProductListItem>>("/api/v1/admin/products", {
    query: params as QueryParams,
  })
}

export function getAdminProduct(productId: number | string) {
  return apiRequest<ProductDetail>(
    `/api/v1/admin/products/${encodeURIComponent(productId)}`
  )
}

export function updateAdminProduct(
  productId: number | string,
  payload: AdminProductRequest
) {
  return apiRequest<ProductDetail>(
    `/api/v1/admin/products/${encodeURIComponent(productId)}`,
    {
      method: "PUT",
      body: payload,
    }
  )
}

export function updateAdminProductStatus(
  productId: number | string,
  payload: AdminProductStatusRequest
) {
  return apiRequest<ProductDetail>(
    `/api/v1/admin/products/${encodeURIComponent(productId)}/status`,
    {
      method: "PATCH",
      body: payload,
    }
  )
}

export function addAdminProductStock(
  productId: number | string,
  payload: AdminProductStockRequest
) {
  return apiRequest<ProductDetail>(
    `/api/v1/admin/products/${encodeURIComponent(productId)}/stock`,
    {
      method: "PATCH",
      body: payload,
    }
  )
}

export function deleteAdminProduct(productId: number | string) {
  return apiRequest<null>(
    `/api/v1/admin/products/${encodeURIComponent(productId)}`,
    {
      method: "DELETE",
    }
  )
}
