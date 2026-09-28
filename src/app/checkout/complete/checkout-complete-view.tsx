"use client"

import Link from "next/link"
import {
  CircleAlert,
  CircleCheck,
  Home,
  LoaderCircle,
  Package,
} from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { getStoredAuthTokens } from "@/lib/api/auth-token-storage"
import { getOrder, type OrderDetail } from "@/lib/api/order"
import { ApiError } from "@/lib/api/types"

type ViewState =
  | { kind: "checking" }
  | { kind: "guest" }
  | { kind: "error" }
  | { kind: "ready"; order: OrderDetail }

export function CheckoutCompleteView({ orderId }: { orderId: number | null }) {
  const [state, setState] = useState<ViewState>({ kind: "checking" })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const id = orderId
    if (id === null) return

    let active = true

    async function checkOrder(validOrderId: number) {
      if (!getStoredAuthTokens()) {
        if (active) setState({ kind: "guest" })
        return
      }

      try {
        const order = await getOrder(validOrderId)
        if (active) setState({ kind: "ready", order })
      } catch (error) {
        if (active) {
          const kind =
            error instanceof ApiError && error.kind === "UNAUTHORIZED"
              ? "guest"
              : "error"
          setState({ kind })
        }
      }
    }

    void checkOrder(id)
    return () => {
      active = false
    }
  }, [attempt, orderId])

  const isPaid =
    state.kind === "ready" &&
    ["PAID", "SHIPPED", "DELIVERED"].includes(state.order.status)
  const content = getContent(state, orderId)

  return (
    <main className="order-page payment-result-page min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <header className="mb-8 border-b border-neutral-200 pb-4">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold">
            <Home className="size-5" aria-hidden="true" />
            CoffeeProd
          </Link>
        </header>

        <section
          className="rounded-lg border border-neutral-200 bg-white p-6 text-center shadow-sm sm:p-8"
          aria-live="polite"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
            {state.kind === "checking" && orderId !== null ? (
              <LoaderCircle className="size-6 animate-spin text-neutral-700" aria-hidden="true" />
            ) : isPaid ? (
              <CircleCheck className="size-6 text-green-700" aria-hidden="true" />
            ) : (
              <CircleAlert className="size-6 text-amber-700" aria-hidden="true" />
            )}
          </div>
          <h1 className="mt-5 break-keep text-balance text-xl font-bold sm:text-2xl">
            {content.title}
          </h1>
          <p className="mt-3 break-keep text-balance text-sm leading-6 text-neutral-600">
            {content.description}
          </p>

          {state.kind === "ready" && (
            <dl className="mx-auto mt-6 grid max-w-sm gap-3 rounded-lg border border-neutral-200 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">주문 번호</dt>
                <dd className="font-semibold">{state.order.orderId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">주문 금액</dt>
                <dd className="font-semibold">
                  {state.order.totalPrice.toLocaleString()}원
                </dd>
              </div>
            </dl>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {state.kind === "guest" ? (
              <Button asChild>
                <Link href="/login?redirect=/orders">로그인하기</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link
                  href={
                    state.kind === "ready"
                      ? `/orders/${state.order.orderId}`
                      : "/orders"
                  }
                >
                  <Package data-icon="inline-start" />
                  주문 상태 확인
                </Link>
              </Button>
            )}
            {state.kind === "error" && (
              <Button
                variant="outline"
                onClick={() => {
                  setState({ kind: "checking" })
                  setAttempt((current) => current + 1)
                }}
              >
                다시 확인
              </Button>
            )}
            {isPaid && (
              <Button variant="outline" asChild>
                <Link href="/products">상품 더 보기</Link>
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function getContent(state: ViewState, orderId: number | null) {
  if (orderId === null) {
    return {
      title: "확인할 주문 정보가 없습니다",
      description: "주문 내역에서 결제 상태를 확인해 주세요.",
    }
  }
  if (state.kind === "checking") {
    return {
      title: "주문 상태 확인 중",
      description: "주문 내역을 확인하고 있습니다.",
    }
  }
  if (state.kind === "guest") {
    return {
      title: "로그인이 필요합니다",
      description: "로그인한 뒤 주문 내역에서 결제 상태를 확인해 주세요.",
    }
  }
  if (state.kind === "error") {
    return {
      title: "주문 상태를 확인하지 못했습니다",
      description:
        "결제 여부를 단정할 수 없습니다. 다시 결제하기 전에 주문 내역을 확인해 주세요.",
    }
  }
  if (["PAID", "SHIPPED", "DELIVERED"].includes(state.order.status)) {
    return {
      title: "결제가 확인되었습니다",
      description: "주문 내역에서 상태를 확인하세요.",
    }
  }
  if (state.order.status === "CANCELED") {
    return {
      title: "취소된 주문입니다",
      description: "주문 상세에서 상태를 확인해 주세요.",
    }
  }
  return {
    title: "결제 상태를 확인해 주세요",
    description:
      "결제 완료 여부를 단정할 수 없습니다. 주문 상세에서 최신 상태를 확인해 주세요.",
  }
}
