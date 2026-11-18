"use client"

import { BarChart3, Calculator, RefreshCw } from "lucide-react"
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  aggregateSalesStatisticsRange,
  getSalesStatistics,
  type SalesStatistics,
  type SalesStatisticsParams,
  type SalesStatisticsUnit,
} from "@/lib/api/statistics"
import { ApiError } from "@/lib/api/types"

const unitLabels: Record<SalesStatisticsUnit, string> = {
  DAILY: "일별",
  MONTHLY: "월별",
  YEARLY: "연도별",
}

type StatisticsRequest = { filters: SalesStatisticsParams } & (
  | { status: "loading" | "success" }
  | { status: "error"; message: string }
)

type RangeError = { field: "from" | "to"; message: string }

export function SalesStatisticsView() {
  const [initialFilters] = useState(getInitialFilters)
  const [draft, setDraft] = useState(initialFilters)
  const [aggregateRange, setAggregateRange] = useState({ from: initialFilters.from, to: initialFilters.to })
  const [request, setRequest] = useState<StatisticsRequest>({ filters: initialFilters, status: "loading" })
  const [result, setResult] = useState<{ filters: SalesStatisticsParams; rows: SalesStatistics[] } | null>(null)
  const [searchError, setSearchError] = useState<RangeError | null>(null)
  const [aggregateError, setAggregateError] = useState<RangeError | null>(null)
  const [aggregateMessage, setAggregateMessage] = useState("")
  const [isAggregating, setIsAggregating] = useState(false)
  const mounted = useRef(false)
  const pendingRequest = useRef<{ filters: SalesStatisticsParams } | null>(null)
  const aggregationInProgress = useRef(false)

  const loadStatistics = useCallback(async (filters: SalesStatisticsParams) => {
    if (pendingRequest.current && sameFilters(filters, pendingRequest.current.filters)) return

    const attempt = { filters }
    pendingRequest.current = attempt
    setRequest({ filters, status: "loading" })
    try {
      const rows = await getSalesStatistics(filters)
      if (mounted.current && pendingRequest.current === attempt) {
        setResult({ filters, rows })
        setRequest({ filters, status: "success" })
      }
    } catch (error) {
      if (mounted.current && pendingRequest.current === attempt) {
        setRequest({ filters, status: "error", message: getStatisticsErrorMessage(error) })
      }
    } finally {
      if (pendingRequest.current === attempt) pendingRequest.current = null
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    queueMicrotask(() => {
      if (mounted.current) void loadStatistics(initialFilters)
    })
    return () => {
      mounted.current = false
    }
  }, [initialFilters, loadStatistics])

  const hasUnappliedFilters = !sameFilters(draft, request.filters)
  const isLoading = request.status === "loading"
  const isLoadingDraft = isLoading && !hasUnappliedFilters

  function changeSearchDate(field: "from" | "to", value: string) {
    setSearchError(null)
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function changeAggregateDate(field: "from" | "to", value: string) {
    setAggregateError(null)
    setAggregateRange((current) => ({ ...current, [field]: value }))
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (aggregationInProgress.current) return

    const { from, to, days } = readDateRange(event.currentTarget)
    if (days < 1) {
      setSearchError({ field: "from", message: "조회 시작일은 종료일보다 늦을 수 없습니다." })
      from.focus()
      return
    }

    if (Number.isFinite(days)) {
      setSearchError(null)
      void loadStatistics({ unit: draft.unit, from: from.value, to: to.value })
    }
  }

  async function handleAggregate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (aggregationInProgress.current || pendingRequest.current) return

    const { from, to, days } = readDateRange(event.currentTarget)
    setAggregateMessage("")
    if (days < 1) {
      setAggregateError({ field: "from", message: "재집계 시작일은 종료일보다 늦을 수 없습니다." })
      from.focus()
      return
    }

    if (days > 366) {
      setAggregateError({ field: "to", message: "기간 재집계는 최대 366일까지 가능합니다." })
      to.focus()
      return
    }

    if (!Number.isFinite(days)) return

    aggregationInProgress.current = true
    setIsAggregating(true)
    setAggregateError(null)

    try {
      const aggregated = await aggregateSalesStatisticsRange(from.value, to.value)
      if (!mounted.current) return

      setAggregateMessage(
        `${aggregated.from}부터 ${aggregated.to}까지 ${aggregated.aggregatedDays.toLocaleString()}일의 매출을 재집계했습니다.`
      )
      const filters = { unit: draft.unit, from: aggregated.from, to: aggregated.to }
      setSearchError(null)
      setDraft(filters)
      void loadStatistics(filters)
    } catch (error) {
      if (mounted.current) setAggregateMessage(`재집계 실패. ${getStatisticsErrorMessage(error)}`)
    } finally {
      aggregationInProgress.current = false
      if (mounted.current) setIsAggregating(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <search className="min-w-0">
          <form aria-label="매출 통계 조회" className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-4" onSubmit={handleSearch}>
            <FilterSelect value={draft.unit} disabled={isAggregating} onChange={(unit) => setDraft((current) => ({ ...current, unit }))} />
            <DateInput
              id="sales-from"
              name="from"
              label="조회 시작일"
              value={draft.from}
              disabled={isAggregating}
              errorId={searchError?.field === "from" ? "sales-date-error" : undefined}
              onChange={(value) => changeSearchDate("from", value)}
            />
            <DateInput
              id="sales-to"
              name="to"
              label="조회 종료일"
              value={draft.to}
              disabled={isAggregating}
              onChange={(value) => changeSearchDate("to", value)}
            />
            <Button className="self-end" type="submit" disabled={isLoadingDraft || isAggregating}>
              <RefreshCw data-icon="inline-start" />
              {isLoadingDraft ? "조회 중" : "조회"}
            </Button>
            <p id="sales-date-error" className="text-sm font-medium text-destructive empty:sr-only sm:col-span-4" role="alert">{searchError?.message}</p>
            {hasUnappliedFilters && <p className="text-sm text-neutral-500 sm:col-span-4">조회 버튼을 누르면 변경한 조건을 적용합니다.</p>}
          </form>
        </search>

        <form aria-labelledby="sales-aggregate-title" className="flex min-w-0 flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm" onSubmit={handleAggregate} method="post">
          <div>
            <h2 id="sales-aggregate-title" className="text-sm font-bold">기간 매출 재집계</h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              시작일과 종료일을 포함해 최대 366일까지 다시 집계합니다.
            </p>
          </div>
          <div className="grid gap-2 min-[380px]:grid-cols-2">
            <DateInput
              id="sales-aggregate-from"
              name="from"
              label="재집계 시작일"
              value={aggregateRange.from}
              disabled={isAggregating}
              errorId={aggregateError?.field === "from" ? "sales-aggregate-error" : undefined}
              onChange={(value) => changeAggregateDate("from", value)}
            />
            <DateInput
              id="sales-aggregate-to"
              name="to"
              label="재집계 종료일"
              value={aggregateRange.to}
              disabled={isAggregating}
              errorId={aggregateError?.field === "to" ? "sales-aggregate-error" : undefined}
              onChange={(value) => changeAggregateDate("to", value)}
            />
          </div>
          <p id="sales-aggregate-error" className="text-sm font-medium text-destructive empty:sr-only" role="alert">{aggregateError?.message}</p>
          <Button type="submit" variant="outline" disabled={isLoading || isAggregating}>
            <Calculator data-icon="inline-start" />
            {isAggregating ? "기간 집계 중" : "선택 기간 재집계"}
          </Button>
          <p className="break-words text-sm empty:sr-only" role="status">{isAggregating ? "매출을 재집계하고 있습니다." : aggregateMessage}</p>
        </form>
      </section>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
        <p role="status" className="min-w-0 break-words">
          <span className="font-semibold">
            {isLoading ? "조회 중" : request.status === "error" ? "조회 실패" : result?.rows.length ? "조회 결과" : "조회 결과 없음"}
          </span>
          {" · "}{formatFilters(request.filters)}
          {request.status === "error" && <span className="mt-1 block">{request.message}</span>}
        </p>
        {request.status === "error" && (
          <Button type="button" variant="outline" disabled={isAggregating} onClick={() => {
            if (!aggregationInProgress.current) void loadStatistics(request.filters)
          }}>
            같은 조건으로 다시 조회
          </Button>
        )}
      </div>

      {result && (
        <section aria-label="매출 통계 결과" className="flex min-w-0 flex-col gap-3">
          {request.status !== "success" && (
            <p className="text-sm font-semibold">이전 결과 · {formatFilters(result.filters)}</p>
          )}
          <StatisticsResults statistics={result.rows} />
        </section>
      )}
    </div>
  )
}

function StatisticsResults({ statistics }: { statistics: SalesStatistics[] }) {
  const totals = useMemo(
    () =>
      statistics.reduce(
        (current, item) => ({
          orderCount: current.orderCount + item.orderCount,
          productSalesAmount: current.productSalesAmount + item.productSalesAmount,
          deliveryFeeAmount: current.deliveryFeeAmount + item.deliveryFeeAmount,
          usedMileageAmount: current.usedMileageAmount + item.usedMileageAmount,
          paymentAmount: current.paymentAmount + item.paymentAmount,
        }),
        {
          orderCount: 0,
          productSalesAmount: 0,
          deliveryFeeAmount: 0,
          usedMileageAmount: 0,
          paymentAmount: 0,
        }
      ),
    [statistics]
  )
  const maxPaymentAmount = statistics.reduce((max, item) => Math.max(max, item.paymentAmount), 1)

  return (
    <>
      {statistics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricCard label="결제 완료 주문" value={`${totals.orderCount.toLocaleString()}건`} />
          <MetricCard label="상품 매출" value={`${totals.productSalesAmount.toLocaleString()}원`} />
          <MetricCard label="배송비" value={`${totals.deliveryFeeAmount.toLocaleString()}원`} />
          <MetricCard label="사용 마일리지" value={`${totals.usedMileageAmount.toLocaleString()}P`} />
          <MetricCard label="실제 결제액" value={`${totals.paymentAmount.toLocaleString()}원`} emphasized />
        </div>
      )}
      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-neutral-200 p-4">
          <BarChart3 className="size-5 text-neutral-500" />
          <h2 id="sales-table-title" className="font-bold">기간별 매출</h2>
        </div>
        {statistics.length ? (
          <div className="sales-table-scroll overflow-x-auto" role="region" aria-labelledby="sales-table-title" tabIndex={0}>
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">기간별 주문 수와 상품 매출, 배송비, 사용 마일리지, 실제 결제액</caption>
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">기간</th>
                  <th scope="col" className="px-4 py-3 font-medium">주문</th>
                  <th scope="col" className="px-4 py-3 font-medium">상품 매출</th>
                  <th scope="col" className="px-4 py-3 font-medium">배송비</th>
                  <th scope="col" className="px-4 py-3 font-medium">마일리지</th>
                  <th scope="col" className="px-4 py-3 font-medium">실제 결제액</th>
                </tr>
              </thead>
              <tbody>
                {statistics.map((item) => (
                  <tr key={item.label} className="border-t border-neutral-200">
                    <th scope="row" className="px-4 py-4 font-semibold">{item.label}</th>
                    <td className="px-4 py-4">{item.orderCount.toLocaleString()}건</td>
                    <td className="px-4 py-4">{item.productSalesAmount.toLocaleString()}원</td>
                    <td className="px-4 py-4">{item.deliveryFeeAmount.toLocaleString()}원</td>
                    <td className="px-4 py-4">{item.usedMileageAmount.toLocaleString()}P</td>
                    <td className="min-w-56 px-4 py-4">
                      <div className="font-bold">{item.paymentAmount.toLocaleString()}원</div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-neutral-950"
                          style={{ width: `${Math.max((item.paymentAmount / maxPaymentAmount) * 100, 2)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-neutral-500">조회 기간에 집계된 매출이 없습니다.</p>
        )}
      </section>
    </>
  )
}

function FilterSelect({ value, disabled, onChange }: {
  value: SalesStatisticsUnit
  disabled: boolean
  onChange: (value: SalesStatisticsUnit) => void
}) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-sm font-semibold">집계 단위</span>
      <select name="unit" value={value} disabled={disabled} className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-2 text-base" onChange={(event) => onChange(event.currentTarget.value as SalesStatisticsUnit)}>
        {Object.entries(unitLabels).map(([unit, label]) => <option key={unit} value={unit}>{label}</option>)}
      </select>
    </label>
  )
}

function DateInput({ id, name, label, value, disabled, errorId, onChange }: {
  id: string
  name: "from" | "to"
  label: string
  value: string
  disabled: boolean
  errorId?: string
  onChange: (value: string) => void
}) {
  return (
    <label htmlFor={id} className="min-w-0">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input id={id} name={name} type="date" value={value} required disabled={disabled} aria-invalid={errorId ? true : undefined} aria-describedby={errorId} className="h-11 w-full min-w-0 rounded-lg border border-neutral-300 bg-white px-2 text-base aria-invalid:border-destructive" onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  )
}

function MetricCard({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <article className={emphasized ? "rounded-lg bg-neutral-950 p-4 text-white shadow-sm" : "rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"}>
      <p className={emphasized ? "text-xs text-neutral-300" : "text-xs text-neutral-500"}>{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </article>
  )
}

function getLocalDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getInitialFilters(): SalesStatisticsParams {
  const to = new Date()
  const from = new Date(to)
  from.setDate(to.getDate() - 30)
  return { unit: "DAILY", from: getLocalDateInputValue(from), to: getLocalDateInputValue(to) }
}

function readDateRange(form: HTMLFormElement) {
  const from = form.elements.namedItem("from") as HTMLInputElement
  const to = form.elements.namedItem("to") as HTMLInputElement
  const days = (to.valueAsNumber - from.valueAsNumber) / 86_400_000 + 1
  return { from, to, days }
}

function sameFilters(first: SalesStatisticsParams, second: SalesStatisticsParams) {
  return first.unit === second.unit && first.from === second.from && first.to === second.to
}

function formatFilters({ unit, from, to }: SalesStatisticsParams) {
  return `${from} ~ ${to} · ${unitLabels[unit]}`
}

function getStatisticsErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "매출 통계 요청을 처리하지 못했습니다."
}
