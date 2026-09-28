"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, LoaderCircle, ReceiptText } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { getStoredAuthTokens } from "@/lib/api/auth-token-storage"
import { confirmPayment } from "@/lib/api/payment"

type PaymentSuccessViewProps = {
  paymentKey: string | null
  tossOrderId: string | null
  amount: number | null
}

export function PaymentSuccessView({
  paymentKey,
  tossOrderId,
  amount,
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
        setMessage("결제 정보를 확인할 수 없습니다. 주문 내역에서 결제 상태를 확인해 주세요.")
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

        if (payment.status !== "SUCCESS") {
          setMessage("결제 완료 여부를 확인할 수 없습니다. 주문 내역에서 상태를 확인해 주세요.")
          return
        }

        router.replace(`/checkout/complete?orderId=${payment.orderId}`)
      } catch {
        setMessage("결제 완료 여부를 확인할 수 없습니다. 다시 결제하기 전에 주문 내역에서 상태를 확인해 주세요.")
      }
    }

    void approvePayment()
  }, [amount, paymentKey, router, tossOrderId])

  return (
    <main className="order-page payment-result-page min-h-screen bg-neutral-50 px-6 py-10 text-neutral-950">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          {message ? (
            <ReceiptText className="size-8 text-red-600" />
          ) : (
            <LoaderCircle className="size-8 animate-spin text-neutral-600" aria-hidden="true" />
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {message ? "결제 상태 확인이 필요합니다" : "결제 결과 확인 중"}
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
            결제 결과를 확인하고 있습니다. 잠시만 기다려 주세요.
          </p>
        )}

        {message && (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild>
              <Link href="/orders">주문 상태 확인</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <Home data-icon="inline-start" />
                홈
              </Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
