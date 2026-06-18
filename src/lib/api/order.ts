import type { GrindType } from "./cart"
import { apiRequest, type QueryParams } from "./client"
import type { PageResponse } from "./types"

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED"

export type CreateOrderRequest = {
  addressId: number
  usedMileage: number
}

export type OrderItem = {
  orderItemId: number
  productId: number
  productName: string
  orderPrice: number
  quantity: number
  grindType: GrindType
  subTotal: number
}

export type OrderDetail = {
  orderId: number
  tossOrderId: string
  status: OrderStatus
  productTotalPrice: number
  deliveryFee: number
  earnedMileage: number
  totalPrice: number
  usedMileage: number
  deliveryAddress: string
  trackingNo: string | null
  orderDate: string
  orderItems: OrderItem[]
}

export type OrderListItem = {
  orderId: number
  status: OrderStatus
  totalPrice: number
  orderDate: string
  itemCount: number
  firstProductName: string
}

export type OrderListParams = {
  page?: number
  size?: number
  sort?: string
}

export function createOrder(payload: CreateOrderRequest) {
  return apiRequest<OrderDetail>("/api/v1/orders", {
    method: "POST",
    body: payload,
  })
}

export function getOrders(params: OrderListParams = {}) {
  return apiRequest<PageResponse<OrderListItem>>("/api/v1/orders", {
    query: params as QueryParams,
  })
}

export function getOrder(orderId: number | string) {
  return apiRequest<OrderDetail>(`/api/v1/orders/${encodeURIComponent(orderId)}`)
}

export function cancelOrder(orderId: number | string) {
  return apiRequest<OrderDetail>(
    `/api/v1/orders/${encodeURIComponent(orderId)}/cancel`,
    {
      method: "POST",
    }
  )
}
