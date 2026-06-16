"use client"

import {
  ArrowLeft,
  ArrowRight,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  Truck,
} from "lucide-react"
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  getAdminOrders,
  updateAdminOrderStatus,
  type AdminOrderListItem,
} from "@/lib/api/admin"
import { type OrderStatus } from "@/lib/api/order"
import { ApiError, type PageResponse } from "@/lib/api/types"
import { getOrderStatusLabel } from "@/lib/order-display"
import { cn } from "@/lib/utils"

const pageSize = 20
const defaultSort = "orderDate,desc"

const statusTransitionMap: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELED"],
  PAID: ["SHIPPED", "CANCELED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELED: [],
}

const inputClassName =
  "h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950 disabled:bg-neutral-100 disabled:text-neutral-400"

export function OrdersAdminView() {
  const [page, setPage] = useState(0)
  const [orders, setOrders] = useState<PageResponse<AdminOrderListItem> | null>(
    null
  )
  const [statusDrafts, setStatusDrafts] = useState<Record<number, OrderStatus>>(
    {}
  )
  const [trackingDrafts, setTrackingDrafts] = useState<Record<number, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<"success" | "error">(
    "success"
  )
  const [isLoading, setIsLoading] = useState(true)
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadOrders() {
      setIsLoading(true)
      setMessage(null)

      try {
        const nextOrders = await getAdminOrders({
          page,
          size: pageSize,
          sort: defaultSort,
        })

        if (!isActive) {
          return
        }

        setOrders(nextOrders)
        setStatusDrafts((current) => {
          const nextDrafts = { ...current }

          for (const order of nextOrders.content) {
            const allowedStatuses = statusTransitionMap[order.status]
            nextDrafts[order.orderId] =
              current[order.orderId] ?? allowedStatuses[0] ?? order.status
          }

          return nextDrafts
        })
        setTrackingDrafts((current) => {
          const nextDrafts = { ...current }

          for (const order of nextOrders.content) {
            nextDrafts[order.orderId] =
              current[order.orderId] ?? order.trackingNo ?? ""
          }

          return nextDrafts
        })
      } catch (error) {
        if (isActive) {
          setMessageTone("error")
          setMessage(getAdminErrorMessage(error))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadOrders()

    return () => {
      isActive = false
    }
  }, [page])

  function handleStatusChange(
    orderId: number,
    event: ChangeEvent<HTMLSelectElement>
  ) {
    const status = event.currentTarget.value as OrderStatus

    setStatusDrafts((current) => ({
      ...current,
      [orderId]: status,
    }))
    setMessage(null)
  }

  function handleTrackingChange(
    orderId: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const { value } = event.currentTarget

    setTrackingDrafts((current) => ({
      ...current,
      [orderId]: value,
    }))
    setMessage(null)
  }

  async function handleStatusSubmit(
    order: AdminOrderListItem,
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const nextStatus = statusDrafts[order.orderId] ?? order.status
    const trackingNo = (trackingDrafts[order.orderId] ?? "").trim()
    const requiresTrackingNo = order.status === "PAID" && nextStatus === "SHIPPED"

    if (requiresTrackingNo && !trackingNo) {
      setMessageTone("error")
      setMessage("배송중 상태로 변경하려면 운송장 번호를 입력해 주세요.")
      return
    }

    setPendingOrderId(order.orderId)
    setMessage(null)

    try {
      const updatedOrder = await updateAdminOrderStatus(order.orderId, {
        status: nextStatus,
        trackingNo: trackingNo || undefined,
      })

      updateOrderInList({
        ...order,
        ...updatedOrder,
        status: updatedOrder.status,
        trackingNo: updatedOrder.trackingNo ?? (trackingNo || null),
      })
      setMessageTone("success")
      setMessage("주문 상태를 변경했습니다.")
    } catch (error) {
      setMessageTone("error")
      setMessage(getAdminErrorMessage(error))
    } finally {
      setPendingOrderId(null)
    }
  }

  function updateOrderInList(updatedOrder: AdminOrderListItem) {
    setOrders((current) =>
      current
        ? {
            ...current,
            content: current.content.map((order) =>
              order.orderId === updatedOrder.orderId ? updatedOrder : order
            ),
          }
        : current
    )

    const allowedStatuses = statusTransitionMap[updatedOrder.status]
    setStatusDrafts((current) => ({
      ...current,
      [updatedOrder.orderId]: allowedStatuses[0] ?? updatedOrder.status,
    }))
    setTrackingDrafts((current) => ({
      ...current,
      [updatedOrder.orderId]: updatedOrder.trackingNo ?? "",
    }))
  }

  function movePage(nextPage: number) {
    setPage(Math.max(nextPage, 0))
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <ReceiptText className="size-5 text-neutral-500" />
          <h2 className="text-lg font-bold">전체 주문 목록</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => movePage(page)}
        >
          <RefreshCw data-icon="inline-start" />
          새로고침
        </Button>
      </div>

      {message && (
        <p
          className={
            messageTone === "success"
              ? "mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700"
              : "mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          }
          role={messageTone === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      {isLoading && (
        <p className="mt-5 text-sm text-neutral-600">
          주문 목록을 불러오고 있습니다.
        </p>
      )}

      {!isLoading && orders?.content.length === 0 && (
        <p className="mt-5 text-sm text-neutral-600">
          표시할 주문이 없습니다.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {orders?.content.map((order) => {
          const allowedStatuses = statusTransitionMap[order.status]
          const draftStatus = statusDrafts[order.orderId] ?? order.status
          const requiresTrackingNo =
            order.status === "PAID" && draftStatus === "SHIPPED"
          const isPending = pendingOrderId === order.orderId
          const canChange = allowedStatuses.length > 0

          return (
            <article
              key={order.orderId}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">주문 #{order.orderId}</h3>
                    <OrderStatusPill status={order.status} />
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    {order.memberEmail} · 회원 ID {order.memberId}
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    {order.firstProductName}
                    {order.itemCount > 1
                      ? ` 외 ${order.itemCount - 1}건`
                      : ""}{" "}
                    · {order.orderDate}
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    결제금액 {order.totalPrice.toLocaleString()}원 · 사용
                    마일리지 {order.usedMileage.toLocaleString()}P
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    운송장 {order.trackingNo ?? "등록 전"}
                  </p>
                </div>

                <form
                  className="flex flex-col gap-2 lg:w-[560px]"
                  onSubmit={(event) => handleStatusSubmit(order, event)}
                >
                  <div className="flex flex-col gap-2 md:flex-row">
                    <select
                      value={draftStatus}
                      disabled={!canChange || isPending}
                      className={inputClassName}
                      aria-label={`주문 ${order.orderId} 변경 상태`}
                      onChange={(event) =>
                        handleStatusChange(order.orderId, event)
                      }
                    >
                      {canChange ? (
                        allowedStatuses.map((status) => (
                          <option key={status} value={status}>
                            {getOrderStatusLabel(status)}
                          </option>
                        ))
                      ) : (
                        <option value={order.status}>
                          변경 가능한 상태 없음
                        </option>
                      )}
                    </select>
                    <Button type="submit" disabled={!canChange || isPending}>
                      <PackageCheck data-icon="inline-start" />
                      {isPending ? "변경 중" : "상태 변경"}
                    </Button>
                  </div>

                  {requiresTrackingNo && (
                    <div className="flex items-center gap-2">
                      <Truck className="size-5 text-neutral-500" />
                      <input
                        value={trackingDrafts[order.orderId] ?? ""}
                        disabled={isPending}
                        className={inputClassName}
                        placeholder="운송장 번호"
                        aria-label={`주문 ${order.orderId} 운송장 번호`}
                        onChange={(event) =>
                          handleTrackingChange(order.orderId, event)
                        }
                      />
                    </div>
                  )}
                </form>
              </div>
            </article>
          )
        })}
      </div>

      {orders && orders.totalPages > 1 && (
        <nav
          className="mt-6 flex items-center justify-center gap-2"
          aria-label="관리자 주문 목록 페이지"
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

function getAdminErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "관리자 요청을 처리하지 못했습니다."
}
