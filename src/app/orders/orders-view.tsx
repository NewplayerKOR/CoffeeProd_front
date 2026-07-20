"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Home,
  Package,
  ReceiptText,
  RotateCcw,
} from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { getStoredAuthTokens } from "@/lib/api/auth-token-storage"
import {
  cancelOrder,
  getOrder,
  getOrders,
  type OrderListItem,
  type OrderStatus,
} from "@/lib/api/order"
import { ApiError, type PageResponse } from "@/lib/api/types"
import { canCancelOrder, getOrderStatusLabel } from "@/lib/order-display"
import { cn } from "@/lib/utils"

type OrdersViewProps = {
  initialPage: number
}

type OrdersStatus = "checking" | "guest" | "ready"

const pageSize = 10
const defaultSort = "orderDate,desc"

export function OrdersView({ initialPage }: OrdersViewProps) {
  const router = useRouter()
  const [status, setStatus] = useState<OrdersStatus>("checking")
  const [page, setPage] = useState(initialPage)
  const [orders, setOrders] = useState<PageResponse<OrderListItem> | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null)
  const [paymentResumeOrderId, setPaymentResumeOrderId] = useState<number | null>(
    null
  )
  const pendingOrders =
    orders?.content.filter((order) => order.status === "PENDING") ?? []

  useEffect(() => {
    let isActive = true

    async function loadOrders() {
      if (!getStoredAuthTokens()) {
        if (isActive) {
          setStatus("guest")
        }
        return
      }

      setStatus("checking")
      setMessage(null)

      try {
        const nextOrders = await getOrders({
          page,
          size: pageSize,
          sort: defaultSort,
        })

        if (isActive) {
          setOrders(nextOrders)
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

    void loadOrders()

    return () => {
      isActive = false
    }
  }, [page])

  function movePage(nextPage: number) {
    const safePage = Math.max(nextPage, 0)

    setPage(safePage)
    router.replace(safePage === 0 ? "/orders" : `/orders?page=${safePage}`)
  }

  async function handleCancelOrder(orderId: number) {
    setPendingOrderId(orderId)
    setMessage(null)

    try {
      const canceledOrder = await cancelOrder(orderId)

      setOrders((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          content: current.content.map((order) =>
            order.orderId === orderId
              ? { ...order, status: canceledOrder.status }
              : order
          ),
        }
      })
    } catch (error) {
      setMessage(getOrderErrorMessage(error))
    } finally {
      setPendingOrderId(null)
    }
  }

  async function handleResumePayment(orderId: number) {
    setPaymentResumeOrderId(orderId)
    setMessage(null)

    try {
      const order = await getOrder(orderId)

      router.push(
        `/checkout/payment?orderId=${order.orderId}&tossOrderId=${encodeURIComponent(
          order.tossOrderId
        )}&amount=${order.totalPrice}`
      )
    } catch (error) {
      setMessage(getOrderErrorMessage(error))
      setPaymentResumeOrderId(null)
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
            <Link href="/me">
              <ArrowLeft data-icon="inline-start" />
              마이페이지
            </Link>
          </Button>
        </header>

        <section className="mb-8">
          <p className="text-sm font-medium text-neutral-500">Orders</p>
          <h1 className="mt-2 text-3xl font-bold">주문 내역</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            내 주문 상태를 확인하고 결제 대기 또는 결제 완료 상태의 주문을
            취소할 수 있습니다.
          </p>
        </section>

        {status === "guest" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
              <ReceiptText className="size-6 text-neutral-500" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">로그인이 필요합니다.</h2>
            <p className="mt-3 text-sm text-neutral-600">
              주문 내역은 로그인 후 확인할 수 있습니다.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/login?redirect=/orders">로그인하기</Link>
            </Button>
          </section>
        )}

        {status === "checking" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
            주문 내역을 확인하고 있습니다.
          </section>
        )}

        {status === "ready" && (
          <section className="flex flex-col gap-4">
            {message && (
              <p
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                role="alert"
              >
                {message}
              </p>
            )}

            {pendingOrders.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <p className="font-semibold">
                  결제 대기 주문이 {pendingOrders.length}건 있습니다.
                </p>
                <p className="mt-1">
                  주문 생성 후 결제를 완료하지 않은 상태입니다. 아래 주문에서
                  결제를 재개하거나 주문을 취소할 수 있습니다.
                </p>
              </div>
            )}

            {orders?.content.length === 0 && (
              <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
                  <Package className="size-6 text-neutral-500" />
                </div>
                <h2 className="mt-5 text-xl font-bold">
                  아직 주문 내역이 없습니다.
                </h2>
                <p className="mt-3 text-sm text-neutral-600">
                  원하는 커피를 담아 첫 주문을 만들어보세요.
                </p>
                <Button className="mt-6" asChild>
                  <Link href="/products">상품 보러가기</Link>
                </Button>
              </div>
            )}

            {orders?.content.map((order) => {
              const isPending = pendingOrderId === order.orderId
              const isPaymentResuming = paymentResumeOrderId === order.orderId
              const cancelable = canCancelOrder(order.status)

              return (
                <article
                  key={order.orderId}
                  className={cn(
                    "rounded-lg border p-5 shadow-sm",
                    order.status === "PENDING"
                      ? "border-amber-200 bg-amber-50/60"
                      : "border-neutral-200 bg-white"
                  )}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold">
                          주문 #{order.orderId}
                        </h2>
                        <OrderStatusPill status={order.status} />
                      </div>
                      <p className="mt-2 text-sm text-neutral-500">
                        {order.orderDate}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-neutral-700">
                        {order.firstProductName}
                        {order.itemCount > 1
                          ? ` 외 ${order.itemCount - 1}건`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <p className="text-xl font-bold">
                        {order.totalPrice.toLocaleString()}원
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {order.status === "PENDING" && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isPaymentResuming}
                            onClick={() => handleResumePayment(order.orderId)}
                          >
                            <CreditCard data-icon="inline-start" />
                            {isPaymentResuming ? "이동 중" : "결제 재개"}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/orders/${order.orderId}`}>
                            상세보기
                          </Link>
                        </Button>
                        {cancelable && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleCancelOrder(order.orderId)}
                          >
                            <RotateCcw data-icon="inline-start" />
                            {isPending ? "취소 중" : "주문 취소"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}

            {orders && orders.totalPages > 1 && (
              <nav
                className="mt-4 flex items-center justify-center gap-2"
                aria-label="주문 목록 페이지"
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={orders.first}
                  onClick={() => movePage(page - 1)}
                >
                  <ArrowLeft data-icon="inline-start" />
                  이전
                </Button>
                <span className="px-2 text-sm text-neutral-600">
                  {orders.number + 1} / {orders.totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={orders.last}
                  onClick={() => movePage(page + 1)}
                >
                  다음
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </nav>
            )}
          </section>
        )}
      </div>
    </main>
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
