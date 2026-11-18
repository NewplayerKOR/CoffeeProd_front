"use client"
import { confirmAction } from "@/components/confirm-action"

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
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  addAdminProductStock,
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProductStatus,
  type AdminProductListItem,
} from "@/lib/api/admin"
import { type ProductStatus } from "@/lib/api/catalog"
import { ApiError, type PageResponse } from "@/lib/api/types"
import { cn } from "@/lib/utils"

type PendingAction = {
  productId: number
  type: "status" | "stock" | "delete"
}

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
  const [refreshCount, setRefreshCount] = useState(0)
  const [products, setProducts] = useState<PageResponse<AdminProductListItem> | null>(
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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const actionInProgress = useRef(false)
  const controlsDisabled = isLoading || pendingAction !== null

  useEffect(() => {
    let isActive = true

    async function loadProducts() {
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
  }, [page, refreshCount, statusFilter])

  function handleStatusFilterChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextStatus = event.currentTarget.value as ProductStatus | "ALL"
    if (controlsDisabled || actionInProgress.current || nextStatus === statusFilter) return

    setIsLoading(true)
    setMessage(null)
    setProducts(null)
    setStatusFilter(nextStatus)
    setPage(0)
  }

  function refreshProducts() {
    if (controlsDisabled || actionInProgress.current) return

    setIsLoading(true)
    setMessage(null)
    setRefreshCount((current) => current + 1)
  }

  function beginAction(action: PendingAction) {
    if (isLoading || actionInProgress.current) return false

    actionInProgress.current = true
    setPendingAction(action)
    setMessage(null)
    return true
  }

  function finishAction() {
    actionInProgress.current = false
    setPendingAction(null)
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

  async function handleStatusSubmit(product: AdminProductListItem) {
    if (controlsDisabled || actionInProgress.current) return

    if (!(await confirmAction({
      title: `${product.name} 판매 상태 변경`,
      description: `${getStatusLabel(statusDrafts[product.id] ?? product.status)} 상태로 변경합니다. 고객에게 표시되는 상태가 바뀌며 복원하려면 다시 변경해야 합니다.`,
      confirmLabel: "판매 상태 변경",
    }))) return
    const status = statusDrafts[product.id] ?? product.status

    if (!beginAction({ productId: product.id, type: "status" })) return

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
      finishAction()
    }
  }

  async function handleStockSubmit(
    product: AdminProductListItem,
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    if (controlsDisabled || actionInProgress.current) return

    const quantity = Number(stockDrafts[product.id])

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessageTone("error")
      setMessage("추가할 재고 수량은 1 이상의 정수로 입력해 주세요.")
      return
    }

    if (!beginAction({ productId: product.id, type: "stock" })) return

    try {
      const updated = await addAdminProductStock(product.id, { quantity })
      setProducts((current) =>
        current
          ? {
              ...current,
              content: current.content.map((item) =>
                item.id === product.id ? { ...item, stockQuantity: updated.stockQuantity } : item
              ),
            }
          : current
      )
      setStockDrafts((current) => ({
        ...current,
        [product.id]: "",
      }))
      setMessageTone("success")
      setMessage("상품 재고를 추가했습니다.")
    } catch (error) {
      setMessageTone("error")
      setMessage(
        error instanceof ApiError && (error.kind === "NETWORK_ERROR" || error.httpStatus >= 500)
          ? "재고 추가 결과를 확인하지 못했습니다. 다시 추가하기 전에 새로고침으로 현재 재고를 확인해 주세요."
          : getAdminErrorMessage(error)
      )
    } finally {
      finishAction()
    }
  }

  async function handleDeleteProduct(product: AdminProductListItem) {
    if (controlsDisabled || actionInProgress.current) return

    if (!(await confirmAction({
      title: `${product.name} 상품 삭제`,
      description: "판매 목록에서 제외되며 이 화면에서 복구할 수 없습니다.",
      confirmLabel: "상품 삭제",
    }))) return
    if (!beginAction({ productId: product.id, type: "delete" })) return

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
      finishAction()
    }
  }

  function movePage(nextPage: number) {
    if (controlsDisabled || actionInProgress.current || nextPage < 0 || nextPage === page) return

    setIsLoading(true)
    setMessage(null)
    setProducts(null)
    setPage(nextPage)
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
            disabled={controlsDisabled}
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
            disabled={controlsDisabled}
            onClick={refreshProducts}
          >
            <RefreshCw data-icon="inline-start" />
            새로고침
          </Button>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-neutral-600">
        판매중, 품절, 숨김 상품을 확인하고 판매 상태와 재고를 관리합니다.
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
        <p className="mt-5 text-sm text-neutral-600" role="status">
          상품 목록을 불러오고 있습니다.
        </p>
      )}

      {!isLoading && products?.content.length === 0 && (
        <p className="mt-5 text-sm text-neutral-600">
          표시할 상품이 없습니다.
        </p>
      )}

      <div aria-busy={isLoading} className="mt-5 flex flex-col gap-3">
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
          const hasKnownStock = Number.isInteger(product.stockQuantity) && product.stockQuantity >= 0

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
                  <p className="mt-2 text-sm font-semibold">
                    {hasKnownStock
                      ? `현재 재고 ${product.stockQuantity.toLocaleString()}개`
                      : "재고 확인 불가"}
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:w-[560px]">
                  <div className="flex flex-col gap-2 md:flex-row">
                    <select
                      value={statusDrafts[product.id] ?? product.status}
                      disabled={controlsDisabled}
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
                      disabled={controlsDisabled}
                      aria-label={`${product.name} 상태 변경${isStatusPending ? " 중" : ""}`}
                      aria-busy={isStatusPending}
                      onClick={() => handleStatusSubmit(product)}
                    >
                      <RefreshCw data-icon="inline-start" />
                      {isStatusPending ? "변경 중" : "상태 변경"}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/admin/products/${product.id}/edit`} aria-label={`${product.name} 상품 수정`}>
                        <Pencil data-icon="inline-start" />
                        수정
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={controlsDisabled || product.status === "HIDDEN"}
                      aria-label={`${product.name} 삭제 처리${isDeletePending ? " 중" : ""}`}
                      aria-busy={isDeletePending}
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
                      disabled={controlsDisabled}
                      className={inputClassName}
                      placeholder="추가 재고 수량"
                      aria-label={`${product.name} 추가 재고 수량`}
                      onChange={(event) => handleStockChange(product.id, event)}
                    />
                    <Button
                      type="submit"
                      aria-label={`${product.name} ${isStockPending ? "재고 추가 중" : "재고 추가"}`}
                      aria-busy={isStockPending}
                      disabled={controlsDisabled}
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
            disabled={controlsDisabled || products.first}
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
            disabled={controlsDisabled || products.last}
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
