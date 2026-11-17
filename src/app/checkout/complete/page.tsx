import type { Metadata } from "next"
import { CheckoutCompleteView } from "./checkout-complete-view"

type CheckoutCompletePageProps = {
  searchParams: Promise<{ orderId?: string }>
}

export const metadata: Metadata = { title: "주문 완료" }

export default async function CheckoutCompletePage({
  searchParams,
}: CheckoutCompletePageProps) {
  const { orderId } = await searchParams
  const parsedOrderId =
    orderId && /^[1-9]\d*$/.test(orderId) ? Number(orderId) : null

  return (
    <CheckoutCompleteView
      key={parsedOrderId ?? "missing"}
      orderId={
        parsedOrderId !== null && Number.isSafeInteger(parsedOrderId)
          ? parsedOrderId
          : null
      }
    />
  )
}
