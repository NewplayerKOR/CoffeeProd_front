import { apiRequest, type QueryParams } from "./client"
import type { PageResponse } from "./types"

export type QnaStatus = "WAITING" | "ANSWERED"

export type Qna = {
  id: number
  productId: number
  nickname: string
  title: string
  question: string
  answer: string | null
  answererNickname: string | null
  status: QnaStatus
  createdAt: string
  updatedAt: string
  answeredAt: string | null
}

export type QnaQuestionRequest = {
  title: string
  question: string
}

export type QnaListParams = {
  status?: QnaStatus
  page?: number
  size?: number
  sort?: string
}

export function getProductQnas(
  productId: number | string,
  params: QnaListParams = {}
) {
  return apiRequest<PageResponse<Qna>>(
    `/api/v1/products/${encodeURIComponent(productId)}/qnas`,
    {
      auth: false,
      query: params as QueryParams,
    }
  )
}

export function createQna(
  productId: number | string,
  payload: QnaQuestionRequest
) {
  return apiRequest<Qna>(
    `/api/v1/products/${encodeURIComponent(productId)}/qnas`,
    {
      method: "POST",
      body: payload,
    }
  )
}

export function updateQna(qnaId: number | string, payload: QnaQuestionRequest) {
  return apiRequest<Qna>(`/api/v1/qnas/${encodeURIComponent(qnaId)}`, {
    method: "PUT",
    body: payload,
  })
}

export function deleteQna(qnaId: number | string) {
  return apiRequest<null>(`/api/v1/qnas/${encodeURIComponent(qnaId)}`, {
    method: "DELETE",
  })
}

export function getAdminQnas(params: QnaListParams = {}) {
  return apiRequest<PageResponse<Qna>>("/api/v1/admin/qnas", {
    query: params as QueryParams,
  })
}

export function answerAdminQna(qnaId: number | string, answer: string) {
  return apiRequest<Qna>(
    `/api/v1/admin/qnas/${encodeURIComponent(qnaId)}/answer`,
    {
      method: "PATCH",
      body: { answer },
    }
  )
}
