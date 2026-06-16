import Link from "next/link"
import { AlertCircle, ArrowLeft, Home } from "lucide-react"

import { Button } from "@/components/ui/button"

type PaymentFailPageProps = {
  searchParams: Promise<{
    code?: string
    message?: string
    orderId?: string
    internalOrderId?: string
    amount?: string
  }>
}

export default async function PaymentFailPage({
  searchParams,
}: PaymentFailPageProps) {
  const { code, message, orderId, internalOrderId, amount } = await searchParams
  const retryHref =
    internalOrderId && orderId && amount
      ? `/checkout/payment?orderId=${internalOrderId}&tossOrderId=${orderId}&amount=${amount}`
      : "/checkout"

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertCircle className="size-8 text-red-600" />
          <div>
            <p className="text-sm font-medium text-neutral-500">
              Toss Payments
            </p>
            <h1 className="text-2xl font-bold">결제를 완료하지 못했습니다</h1>
          </div>
        </div>

        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-700">
          {message ?? "결제 인증이 취소되었거나 실패했습니다."}
        </p>

        <dl className="grid gap-3 border-y border-neutral-200 py-4 text-sm">
          <SummaryRow label="오류 코드" value={code ?? "-"} />
          <SummaryRow label="Toss 주문 ID" value={orderId ?? "-"} />
        </dl>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" asChild>
            <Link href="/">
              <Home data-icon="inline-start" />
              홈
            </Link>
          </Button>
          <Button asChild>
            <Link href={retryHref}>
              <ArrowLeft data-icon="inline-start" />
              다시 결제
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="max-w-64 truncate text-right font-semibold text-neutral-950">
        {value}
      </dd>
    </div>
  )
}
