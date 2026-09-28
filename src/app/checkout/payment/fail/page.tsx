import Link from "next/link"
import { AlertCircle, Home } from "lucide-react"

import { Button } from "@/components/ui/button"

type PaymentFailPageProps = {
  searchParams: Promise<{
    internalOrderId?: string
  }>
}

export default async function PaymentFailPage({
  searchParams,
}: PaymentFailPageProps) {
  const { internalOrderId } = await searchParams
  const orderId =
    internalOrderId && /^[1-9]\d*$/.test(internalOrderId)
      ? Number(internalOrderId)
      : null
  const orderHref =
    orderId && Number.isSafeInteger(orderId) ? `/orders/${orderId}` : "/orders"

  return (
    <main className="order-page payment-result-page min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertCircle
            className="size-8 shrink-0 text-amber-700"
            aria-hidden="true"
          />
          <h1 className="text-2xl font-bold">결제 상태를 확인해 주세요</h1>
        </div>

        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          이 화면만으로 결제 여부를 확정할 수 없습니다. 주문 내역에서 상태를 확인한 뒤 다음 단계를 진행해 주세요.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild>
            <Link href={orderHref}>주문 상태 확인</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home data-icon="inline-start" />
              홈
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
