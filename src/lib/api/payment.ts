import { apiRequest } from "./client"

export type PaymentStatus = "SUCCESS" | "FAILED" | "REFUNDED"

export type ConfirmPaymentRequest = {
  paymentKey: string
  tossOrderId: string
  amount: number
}

export type Payment = {
  paymentId: number
  orderId: number
  tossOrderId: string
  pgProvider: string
  paymentKey: string
  payMethod: string
  status: PaymentStatus
  paidAt: string
}

export function confirmPayment(payload: ConfirmPaymentRequest) {
  return apiRequest<Payment>("/api/v1/payments/confirm", {
    method: "POST",
    body: payload,
  })
}
