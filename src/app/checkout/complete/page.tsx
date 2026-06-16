import Link from "next/link"
import { CheckCircle2, Home, Package } from "lucide-react"

import { Button } from "@/components/ui/button"

type CheckoutCompletePageProps = {
  searchParams: Promise<{
    orderId?: string
    amount?: string
    paymentId?: string
  }>
}

export default async function CheckoutCompletePage({
  searchParams,
}: CheckoutCompletePageProps) {
  const { orderId, amount, paymentId } = await searchParams
  const parsedAmount = Number(amount)

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Home className="size-5" />
            CoffeeProd
          </Link>
        </header>

        <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
            <CheckCircle2 className="size-6 text-neutral-700" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">결제가 완료되었습니다.</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            주문과 결제 승인 처리가 완료되었습니다.
          </p>

          <dl className="mx-auto mt-6 grid max-w-sm gap-3 rounded-lg border border-neutral-200 p-4 text-sm">
            <CompleteRow label="주문 번호" value={orderId ?? "-"} />
            <CompleteRow label="결제 번호" value={paymentId ?? "-"} />
            <CompleteRow
              label="결제 금액"
              value={
                Number.isFinite(parsedAmount)
                  ? `${parsedAmount.toLocaleString()}원`
                  : "-"
              }
            />
          </dl>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/orders">
                <Package data-icon="inline-start" />
                주문 내역
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/products">상품 더 보기</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}

function CompleteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
