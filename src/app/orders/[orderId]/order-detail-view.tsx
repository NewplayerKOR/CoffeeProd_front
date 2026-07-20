"use client"

import Link from "next/link"
import {
  ArrowLeft,
  CreditCard,
  Home,
  Package,
  ReceiptText,
  RotateCcw,
  Truck,
} from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { getStoredAuthTokens } from "@/lib/api/auth-token-storage"
import {
  cancelOrder,
  getOrder,
  type OrderDetail,
  type OrderStatus,
} from "@/lib/api/order"
import { ApiError } from "@/lib/api/types"
import {
  canCancelOrder,
  getGrindTypeLabel,
  getOrderStatusLabel,
} from "@/lib/order-display"
import { cn } from "@/lib/utils"

type OrderDetailViewProps = {
  orderId: string
}

type OrderDetailStatus = "checking" | "guest" | "ready"

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const [status, setStatus] = useState<OrderDetailStatus>("checking")
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    let isActive = true

    async function loadOrder() {
      if (!getStoredAuthTokens()) {
        if (isActive) {
          setStatus("guest")
        }
        return
      }

      try {
        const nextOrder = await getOrder(orderId)

        if (isActive) {
          setOrder(nextOrder)
          setStatus("ready")
        }
      } catch (error) {
        if (error instanceof ApiError && error.kind === "UNAUTHORIZED") {
          if (isActive) {
            setStatus("guest")
          }
          return
        }

        if (isActive) {
          setMessage(getOrderErrorMessage(error))
          setStatus("ready")
        }
      }
    }

    void loadOrder()

    return () => {
      isActive = false
    }
  }, [orderId])

  async function handleCancelOrder() {
    if (!order || !canCancelOrder(order.status)) {
      return
    }

    setIsCancelling(true)
    setMessage(null)

    try {
      const canceledOrder = await cancelOrder(order.orderId)
      setOrder(canceledOrder)
    } catch (error) {
      setMessage(getOrderErrorMessage(error))
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <main className="order-page min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Home className="size-5" />
            CoffeeProd
          </Link>

          <Button variant="outline" asChild>
            <Link href="/orders">
              <ArrowLeft data-icon="inline-start" />
              주문 내역
            </Link>
          </Button>
        </header>

        {status === "guest" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
              <ReceiptText className="size-6 text-neutral-500" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">로그인이 필요합니다.</h1>
            <p className="mt-3 text-sm text-neutral-600">
              주문 상세는 로그인 후 확인할 수 있습니다.
            </p>
            <Button className="mt-6" asChild>
              <Link href={`/login?redirect=/orders/${orderId}`}>로그인하기</Link>
            </Button>
          </section>
        )}

        {status === "checking" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
            주문 상세를 확인하고 있습니다.
          </section>
        )}

        {status === "ready" && !order && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
              <Package className="size-6 text-neutral-500" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">
              주문 정보를 불러오지 못했습니다.
            </h1>
            {message && (
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                {message}
              </p>
            )}
          </section>
        )}

        {status === "ready" && order && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex flex-col gap-6">
              {message && (
                <p
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                  role="alert"
                >
                  {message}
                </p>
              )}

              {order.status === "PENDING" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  <p className="font-semibold">결제 대기 주문입니다.</p>
                  <p className="mt-1">
                    주문서는 이미 생성되어 장바구니가 비워진 상태입니다. 결제를
                    계속 진행하거나 주문을 취소할 수 있습니다.
                  </p>
                </div>
              )}

              <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold">
                        주문 #{order.orderId}
                      </h1>
                      <OrderStatusPill status={order.status} />
                    </div>
                    <p className="mt-2 text-sm text-neutral-500">
                      {order.orderDate}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {order.status === "PENDING" && (
                      <Button asChild>
                        <Link
                          href={`/checkout/payment?orderId=${order.orderId}&tossOrderId=${encodeURIComponent(
                            order.tossOrderId
                          )}&amount=${order.totalPrice}`}
                        >
                          <CreditCard data-icon="inline-start" />
                          결제하기
                        </Link>
                      </Button>
                    )}
                    {canCancelOrder(order.status) && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isCancelling}
                        onClick={handleCancelOrder}
                      >
                        <RotateCcw data-icon="inline-start" />
                        {isCancelling ? "취소 중" : "주문 취소"}
                      </Button>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold">주문 상품</h2>
                <div className="mt-5 flex flex-col gap-3">
                  {order.orderItems.map((item) => (
                    <article
                      key={item.orderItemId}
                      className="rounded-lg border border-neutral-200 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <Link
                            href={`/products/${item.productId}`}
                            className="font-semibold hover:underline"
                          >
                            {item.productName}
                          </Link>
                          <p className="mt-1 text-sm text-neutral-500">
                            {getGrindTypeLabel(item.grindType)} /{" "}
                            {item.quantity}개
                          </p>
                          <p className="mt-1 text-sm text-neutral-500">
                            단가 {item.orderPrice.toLocaleString()}원
                          </p>
                        </div>
                        <p className="font-bold">
                          {item.subTotal.toLocaleString()}원
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Truck className="size-5 text-neutral-500" />
                  <h2 className="text-lg font-bold">배송 정보</h2>
                </div>
                <p className="mt-4 text-sm leading-6 text-neutral-700">
                  {order.deliveryAddress}
                </p>
                <p className="mt-3 text-sm text-neutral-500">
                  운송장: {order.trackingNo ?? "등록 전"}
                </p>
              </section>
            </div>

            <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">결제 요약</h2>
              <div className="mt-5 flex flex-col gap-3 border-y border-neutral-200 py-4 text-sm">
                <SummaryRow
                  label="상품 금액"
                  value={`${order.productTotalPrice.toLocaleString()}원`}
                />
                <SummaryRow
                  label="배송비"
                  value={
                    order.deliveryFee === 0
                      ? "무료"
                      : `${order.deliveryFee.toLocaleString()}원`
                  }
                />
                <SummaryRow
                  label="사용 마일리지"
                  value={`-${order.usedMileage.toLocaleString()}P`}
                />
                <SummaryRow
                  label="적립 마일리지"
                  value={
                    order.earnedMileage > 0
                      ? `+${order.earnedMileage.toLocaleString()}P`
                      : "결제 완료 후 적립"
                  }
                />
                <SummaryRow
                  label="주문 상태"
                  value={getOrderStatusLabel(order.status)}
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <span className="font-semibold">총 결제 금액</span>
                <span className="text-xl font-bold">
                  {order.totalPrice.toLocaleString()}원
                </span>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-neutral-500">{label}</span>
      <span className="font-semibold text-neutral-900">{value}</span>
    </div>
  )
}

function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        status === "PENDING" && "bg-neutral-100 text-neutral-700",
        status === "PAID" && "bg-neutral-950 text-white",
        status === "SHIPPED" && "bg-neutral-200 text-neutral-800",
        status === "DELIVERED" && "bg-neutral-100 text-neutral-600",
        status === "CANCELED" && "bg-red-50 text-red-700"
      )}
    >
      {getOrderStatusLabel(status)}
    </span>
  )
}

function getOrderErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "주문 요청을 처리하지 못했습니다."
}
