import { PaymentSuccessView } from "./payment-success-view"

type PaymentSuccessPageProps = {
  searchParams: Promise<{
    paymentKey?: string
    orderId?: string
    amount?: string
    paymentType?: string
  }>
}

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const { paymentKey, orderId, amount, paymentType } = await searchParams
  const parsedAmount = Number(amount)

  return (
    <PaymentSuccessView
      paymentKey={paymentKey ?? null}
      tossOrderId={orderId ?? null}
      amount={Number.isFinite(parsedAmount) ? parsedAmount : null}
      paymentType={paymentType ?? null}
    />
  )
}
