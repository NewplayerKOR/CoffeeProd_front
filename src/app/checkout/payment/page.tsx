import { PaymentConfirmView } from "./payment-confirm-view"

type PaymentPageProps = {
  searchParams: Promise<{
    orderId?: string
    tossOrderId?: string
    amount?: string
  }>
}

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const { orderId, tossOrderId, amount } = await searchParams
  const parsedOrderId = Number(orderId)
  const parsedAmount = Number(amount)
  const tossWidgetClientKey =
    process.env.TOSS_WIDGET_CLIENT_KEY ??
    process.env.TOSS_CLIENT_KEY ??
    process.env.NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY ??
    process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ??
    null

  return (
    <PaymentConfirmView
      orderId={Number.isInteger(parsedOrderId) ? parsedOrderId : null}
      tossOrderId={tossOrderId ?? null}
      amount={Number.isFinite(parsedAmount) ? parsedAmount : null}
      tossWidgetClientKey={tossWidgetClientKey}
    />
  )
}
