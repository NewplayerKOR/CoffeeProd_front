"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Home, LoaderCircle, ReceiptText } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { getStoredAuthTokens } from "@/lib/api/auth-token-storage"
import { confirmPayment } from "@/lib/api/payment"
import { ApiError } from "@/lib/api/types"

type PaymentSuccessViewProps = {
  paymentKey: string | null
  tossOrderId: string | null
  amount: number | null
  paymentType: string | null
}

export function PaymentSuccessView({
  paymentKey,
  tossOrderId,
  amount,
  paymentType,
}: PaymentSuccessViewProps) {
  const router = useRouter()
  const submittedRef = useRef(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (submittedRef.current) {
      return
    }

    submittedRef.current = true

    async function approvePayment() {
      if (!paymentKey || !tossOrderId || amount === null) {
        setMessage("결제 승인에 필요한 리다이렉트 정보가 없습니다.")
        return
      }

      if (!getStoredAuthTokens()) {
        router.replace("/login?redirect=/orders")
        return
      }

      try {
        const payment = await confirmPayment({
          paymentKey,
          tossOrderId,
          amount,
        })

        router.replace(
          `/checkout/complete?orderId=${payment.orderId}&amount=${amount}&paymentId=${payment.paymentId}`
        )
      } catch (error) {
        setMessage(
          error instanceof ApiError
            ? error.message
            : "결제 승인 요청을 처리하지 못했습니다."
        )
      }
    }

    void approvePayment()
  }, [amount, paymentKey, router, tossOrderId])

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          {message ? (
            <ReceiptText className="size-8 text-red-600" />
          ) : (
            <CheckCircle2 className="size-8 text-green-600" />
          )}
          <div>
            <p className="text-sm font-medium text-neutral-500">
              Toss Payments
            </p>
            <h1 className="text-2xl font-bold">
              {message ? "결제 승인 확인 필요" : "결제 승인 처리 중"}
            </h1>
          </div>
        </div>

        {message ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-700">
            {message}
          </p>
        ) : (
          <p className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm font-medium text-neutral-600">
            <LoaderCircle className="size-4 animate-spin" />
            결제 인증 결과를 백엔드 승인 API로 확인하고 있습니다.
          </p>
        )}

        <dl className="grid gap-3 border-y border-neutral-200 py-4 text-sm">
          <SummaryRow label="Toss 주문 ID" value={tossOrderId ?? "-"} />
          <SummaryRow label="결제 금액" value={formatAmount(amount)} />
          <SummaryRow label="결제 타입" value={paymentType ?? "-"} />
        </dl>

        {message && (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" asChild>
              <Link href="/">
                <Home data-icon="inline-start" />
                홈
              </Link>
            </Button>
            <Button asChild>
              <Link href="/orders">주문 내역</Link>
            </Button>
          </div>
        )}
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

function formatAmount(amount: number | null) {
  if (amount === null) {
    return "-"
  }

  return `${amount.toLocaleString()}원`
}
