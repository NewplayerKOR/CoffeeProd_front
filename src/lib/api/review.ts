import { apiRequest, type QueryParams } from "./client"
import type { PageResponse } from "./types"

export type Review = {
  id: number
  nickname: string
  rating: number
  content: string
  createdAt: string
}

export type ReviewRequest = {
  rating: number
  content: string
}

export type ReviewListParams = {
  page?: number
  size?: number
  sort?: string
}

export function getProductReviews(
  productId: number | string,
  params: ReviewListParams = {}
) {
  return apiRequest<PageResponse<Review>>(
    `/api/v1/products/${encodeURIComponent(productId)}/reviews`,
    {
      auth: false,
      query: params as QueryParams,
    }
  )
}

export function createReview(
  productId: number | string,
  payload: ReviewRequest
) {
  return apiRequest<Review>(
    `/api/v1/products/${encodeURIComponent(productId)}/reviews`,
    {
      method: "POST",
      body: payload,
    }
  )
}

export function updateReview(reviewId: number | string, payload: ReviewRequest) {
  return apiRequest<Review>(`/api/v1/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PUT",
    body: payload,
  })
}

export function deleteReview(reviewId: number | string) {
  return apiRequest<null>(`/api/v1/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
  })
}
