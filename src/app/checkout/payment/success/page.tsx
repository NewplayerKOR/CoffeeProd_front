import type { Metadata } from "next"
import { PaymentSuccessView } from "./payment-success-view"

type PaymentSuccessPageProps = {
  searchParams: Promise<{
    paymentKey?: string
    orderId?: string
    amount?: string
  }>
}

export const metadata: Metadata = { title: "결제 승인 처리" }

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const { paymentKey, orderId, amount } = await searchParams
  const parsedAmount =
    amount && /^[1-9]\d*$/.test(amount) ? Number(amount) : null

  return (
    <PaymentSuccessView
      paymentKey={paymentKey ?? null}
      tossOrderId={orderId ?? null}
      amount={
        parsedAmount !== null && Number.isSafeInteger(parsedAmount)
          ? parsedAmount
          : null
      }
    />
  )
}
