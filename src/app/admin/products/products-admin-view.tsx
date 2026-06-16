"use client"

import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  PackagePlus,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  addAdminProductStock,
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProductStatus,
} from "@/lib/api/admin"
import { type ProductListItem, type ProductStatus } from "@/lib/api/catalog"
import { ApiError, type PageResponse } from "@/lib/api/types"
import { cn } from "@/lib/utils"

type PendingAction = {
  productId: number
  type: "status" | "stock" | "delete"
} | null

const pageSize = 10
const defaultSort = "createdAt,desc"

const statusOptions = [
  { value: "ON_SALE", label: "판매중" },
  { value: "SOLD_OUT", label: "품절" },
  { value: "HIDDEN", label: "숨김" },
] satisfies Array<{ value: ProductStatus; label: string }>

const inputClassName =
  "h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950 disabled:bg-neutral-100 disabled:text-neutral-400"

export function ProductsAdminView() {
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "ALL">("ALL")
  const [products, setProducts] = useState<PageResponse<ProductListItem> | null>(
    null
  )
  const [statusDrafts, setStatusDrafts] = useState<Record<number, ProductStatus>>(
    {}
  )
  const [stockDrafts, setStockDrafts] = useState<Record<number, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<"success" | "error">(
    "success"
  )
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  useEffect(() => {
    let isActive = true

    async function loadProducts() {
      setIsLoading(true)
      setMessage(null)

      try {
        const nextProducts = await getAdminProducts({
          page,
          size: pageSize,
          sort: defaultSort,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        })

        if (!isActive) {
          return
        }

        setProducts(nextProducts)
        setStatusDrafts((current) => {
          const nextDrafts = { ...current }

          for (const product of nextProducts.content) {
            nextDrafts[product.id] = current[product.id] ?? product.status
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

    void loadProducts()

    return () => {
      isActive = false
    }
  }, [page, statusFilter])

  function handleStatusFilterChange(event: ChangeEvent<HTMLSelectElement>) {
    setStatusFilter(event.currentTarget.value as ProductStatus | "ALL")
    setPage(0)
  }

  function handleStatusChange(
    productId: number,
    event: ChangeEvent<HTMLSelectElement>
  ) {
    const status = event.currentTarget.value as ProductStatus

    setStatusDrafts((current) => ({
      ...current,
      [productId]: status,
    }))
    setMessage(null)
  }

  function handleStockChange(
    productId: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const { value } = event.currentTarget

    setStockDrafts((current) => ({
      ...current,
      [productId]: value,
    }))
    setMessage(null)
  }

  async function handleStatusSubmit(product: ProductListItem) {
    const status = statusDrafts[product.id] ?? product.status

    setPendingAction({ productId: product.id, type: "status" })
    setMessage(null)

    try {
      await updateAdminProductStatus(product.id, { status })
      setProducts((current) =>
        current
          ? {
              ...current,
              content: current.content.map((item) =>
                item.id === product.id ? { ...item, status } : item
              ),
            }
          : current
      )
      setMessageTone("success")
      setMessage("상품 판매 상태를 변경했습니다.")
    } catch (error) {
      setMessageTone("error")
      setMessage(getAdminErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleStockSubmit(
    product: ProductListItem,
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const quantity = Number(stockDrafts[product.id])

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessageTone("error")
      setMessage("추가할 재고 수량은 1 이상의 정수로 입력해 주세요.")
      return
    }

    setPendingAction({ productId: product.id, type: "stock" })
    setMessage(null)

    try {
      await addAdminProductStock(product.id, { quantity })
      setStockDrafts((current) => ({
        ...current,
        [product.id]: "",
      }))
      setMessageTone("success")
      setMessage("상품 재고를 추가했습니다.")
    } catch (error) {
      setMessageTone("error")
      setMessage(getAdminErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleDeleteProduct(product: ProductListItem) {
    setPendingAction({ productId: product.id, type: "delete" })
    setMessage(null)

    try {
      await deleteAdminProduct(product.id)
      setProducts((current) =>
        current
          ? {
              ...current,
              content:
                statusFilter === "ALL" || statusFilter === "HIDDEN"
                  ? current.content.map((item) =>
                      item.id === product.id
                        ? { ...item, status: "HIDDEN" }
                        : item
                    )
                  : current.content.filter((item) => item.id !== product.id),
            }
          : current
      )
      setStatusDrafts((current) => ({
        ...current,
        [product.id]: "HIDDEN",
      }))
      setMessageTone("success")
      setMessage("상품을 삭제 처리했습니다.")
    } catch (error) {
      setMessageTone("error")
      setMessage(getAdminErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  function movePage(nextPage: number) {
    setPage(Math.max(nextPage, 0))
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Boxes className="size-5 text-neutral-500" />
          <h2 className="text-lg font-bold">상품 목록</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            disabled={isLoading}
            className={inputClassName}
            aria-label="상품 상태 필터"
            onChange={handleStatusFilterChange}
          >
            <option value="ALL">전체 상태</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
      </div>

      <p className="mt-3 text-sm leading-6 text-neutral-600">
        관리자 상품 조회 API를 사용해 판매중, 품절, 숨김 상품을 모두 조회합니다.
        삭제 처리는 실제 DB 삭제가 아니라 상품 상태를 HIDDEN으로 변경합니다.
      </p>

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
          상품 목록을 불러오고 있습니다.
        </p>
      )}

      {!isLoading && products?.content.length === 0 && (
        <p className="mt-5 text-sm text-neutral-600">
          표시할 상품이 없습니다.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {products?.content.map((product) => {
          const isStatusPending =
            pendingAction?.productId === product.id &&
            pendingAction.type === "status"
          const isStockPending =
            pendingAction?.productId === product.id &&
            pendingAction.type === "stock"
          const isDeletePending =
            pendingAction?.productId === product.id &&
            pendingAction.type === "delete"
          const hasPendingAction =
            isStatusPending || isStockPending || isDeletePending

          return (
            <article
              key={product.id}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{product.name}</h3>
                    <StatusPill status={product.status} />
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    ID {product.id} · {product.categoryName} ·{" "}
                    {product.price.toLocaleString()}원
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:w-[560px]">
                  <div className="flex flex-col gap-2 md:flex-row">
                    <select
                      value={statusDrafts[product.id] ?? product.status}
                      disabled={hasPendingAction}
                      className={inputClassName}
                      aria-label={`${product.name} 판매 상태`}
                      onChange={(event) => handleStatusChange(product.id, event)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={hasPendingAction}
                      onClick={() => handleStatusSubmit(product)}
                    >
                      <RefreshCw data-icon="inline-start" />
                      {isStatusPending ? "변경 중" : "상태 변경"}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Pencil data-icon="inline-start" />
                        수정
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={hasPendingAction || product.status === "HIDDEN"}
                      onClick={() => handleDeleteProduct(product)}
                    >
                      <Trash2 data-icon="inline-start" />
                      {isDeletePending ? "삭제 처리 중" : "삭제 처리"}
                    </Button>
                  </div>

                  <form
                    className="flex flex-col gap-2 md:flex-row"
                    onSubmit={(event) => handleStockSubmit(product, event)}
                  >
                    <input
                      type="number"
                      min={1}
                      value={stockDrafts[product.id] ?? ""}
                      disabled={hasPendingAction}
                      className={inputClassName}
                      placeholder="추가 재고 수량"
                      aria-label={`${product.name} 추가 재고 수량`}
                      onChange={(event) => handleStockChange(product.id, event)}
                    />
                    <Button
                      type="submit"
                      disabled={hasPendingAction}
                    >
                      <PackagePlus data-icon="inline-start" />
                      {isStockPending ? "추가 중" : "재고 추가"}
                    </Button>
                  </form>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {products && products.totalPages > 1 && (
        <nav
          className="mt-6 flex items-center justify-center gap-2"
          aria-label="관리자 상품 목록 페이지"
        >
          <Button
            type="button"
            variant="outline"
            disabled={products.first}
            onClick={() => movePage(page - 1)}
          >
            <ArrowLeft data-icon="inline-start" />
            이전
          </Button>
          <span className="px-2 text-sm text-neutral-600">
            {products.number + 1} / {products.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={products.last}
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

function StatusPill({ status }: { status: ProductStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        status === "ON_SALE" && "bg-neutral-950 text-white",
        status === "SOLD_OUT" && "bg-neutral-200 text-neutral-800",
        status === "HIDDEN" && "bg-red-50 text-red-700"
      )}
    >
      {getStatusLabel(status)}
    </span>
  )
}

function getStatusLabel(status: ProductStatus) {
  return (
    statusOptions.find((option) => option.value === status)?.label ?? status
  )
}

function getAdminErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "관리자 요청을 처리하지 못했습니다."
}
