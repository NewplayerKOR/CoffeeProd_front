import { apiRequest } from "./client"

export const CART_CHANGED_EVENT = "coffeeprod:cart-changed"

export type GrindType = "WHOLE_BEAN" | "ESPRESSO" | "DRIP" | "FRENCH_PRESS"

export type AddCartItemRequest = {
  productId: number
  grindType: GrindType
  quantity: number
}

export type UpdateCartItemRequest = {
  grindType: GrindType
  quantity: number
}

export type CartItem = {
  cartItemId: number
  productId: number
  productName: string
  price: number
  quantity: number
  grindType: GrindType
  totalPrice: number
  imageUrl: string | null
}

export type Cart = {
  items: CartItem[]
  totalPrice: number
  totalQuantity: number
}

export function getCart() {
  return apiRequest<Cart>("/api/v1/carts")
}

export function addCartItem(payload: AddCartItemRequest) {
  return apiRequest<Cart>("/api/v1/carts/items", {
    method: "POST",
    body: payload,
  })
}

export function updateCartItem(
  cartItemId: number,
  payload: UpdateCartItemRequest
) {
  return apiRequest<Cart>(`/api/v1/carts/items/${cartItemId}`, {
    method: "PATCH",
    body: payload,
  })
}

export function deleteCartItem(cartItemId: number) {
  return apiRequest<Cart>(`/api/v1/carts/items/${cartItemId}`, {
    method: "DELETE",
  })
}

export function clearCart() {
  return apiRequest<null>("/api/v1/carts", {
    method: "DELETE",
  })
}
