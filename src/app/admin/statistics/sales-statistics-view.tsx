"use client"

import { BarChart3, Calculator, RefreshCw } from "lucide-react"
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  aggregateSalesStatisticsRange,
  getSalesStatistics,
  type SalesStatistics,
  type SalesStatisticsUnit,
} from "@/lib/api/statistics"
import { ApiError } from "@/lib/api/types"

const today = getLocalDateInputValue(new Date())
const thirtyDaysAgo = getLocalDateInputValue(
  new Date(new Date().setDate(new Date().getDate() - 30))
)

export function SalesStatisticsView() {
  const [unit, setUnit] = useState<SalesStatisticsUnit>("DAILY")
  const [from, setFrom] = useState(thirtyDaysAgo)
  const [to, setTo] = useState(today)
  const [aggregateFrom, setAggregateFrom] = useState(thirtyDaysAgo)
  const [aggregateTo, setAggregateTo] = useState(today)
  const [statistics, setStatistics] = useState<SalesStatistics[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAggregating, setIsAggregating] = useState(false)

  const loadStatistics = useCallback(async (showCompletion = false) => {
    try {
      setStatistics(await getSalesStatistics({ unit, from, to }))
      if (showCompletion) {
        setMessage("저장된 매출 통계를 최신 상태로 불러왔습니다.")
      }
    } catch (error) {
      setMessage(getStatisticsErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [from, to, unit])

  useEffect(() => {
    let isActive = true

    void getSalesStatistics({ unit, from, to })
      .then((nextStatistics) => {
        if (isActive) {
          setStatistics(nextStatistics)
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setMessage(getStatisticsErrorMessage(error))
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [from, to, unit])

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
  const maxPaymentAmount = Math.max(...statistics.map((item) => item.paymentAmount), 1)

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (from > to) {
      setMessage("조회 시작일은 종료일보다 늦을 수 없습니다.")
      return
    }

    setIsLoading(true)
    setMessage(null)
    await loadStatistics(true)
  }

  async function handleAggregate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (aggregateFrom > aggregateTo) {
      setMessage("재집계 시작일은 종료일보다 늦을 수 없습니다.")
      return
    }

    if (getInclusiveDayCount(aggregateFrom, aggregateTo) > 366) {
      setMessage("기간 재집계는 최대 366일까지 가능합니다.")
      return
    }

    setIsAggregating(true)
    setMessage(null)

    try {
      const result = await aggregateSalesStatisticsRange(
        aggregateFrom,
        aggregateTo
      )
      const isCurrentRange = from === result.from && to === result.to

      setMessage(
        `${result.from}부터 ${result.to}까지 ${result.aggregatedDays.toLocaleString()}일의 매출을 재집계했습니다.`
      )
      setFrom(result.from)
      setTo(result.to)

      if (isCurrentRange) {
        await loadStatistics()
      }
    } catch (error) {
      setMessage(getStatisticsErrorMessage(error))
    } finally {
      setIsAggregating(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-4" onSubmit={handleSearch}>
          <FilterSelect value={unit} onChange={setUnit} />
          <DateInput label="시작일" value={from} onChange={setFrom} />
          <DateInput label="종료일" value={to} onChange={setTo} />
          <Button className="self-end" type="submit" disabled={isLoading}>
            <RefreshCw data-icon="inline-start" />
            {isLoading ? "조회 중" : "조회"}
          </Button>
        </form>

        <form className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm" onSubmit={handleAggregate}>
          <div>
            <h2 className="text-sm font-bold">기간 매출 재집계</h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              시작일과 종료일을 포함해 최대 366일까지 다시 집계합니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DateInput
              label="시작일"
              value={aggregateFrom}
              onChange={setAggregateFrom}
            />
            <DateInput
              label="종료일"
              value={aggregateTo}
              onChange={setAggregateTo}
            />
          </div>
          <Button type="submit" variant="outline" disabled={isAggregating}>
            <Calculator data-icon="inline-start" />
            {isAggregating ? "기간 집계 중" : "선택 기간 재집계"}
          </Button>
        </form>
      </section>

      {message && (
        <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm font-medium" role="status">
          {message}
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard label="결제 완료 주문" value={`${totals.orderCount.toLocaleString()}건`} />
        <MetricCard label="상품 매출" value={`${totals.productSalesAmount.toLocaleString()}원`} />
        <MetricCard label="배송비" value={`${totals.deliveryFeeAmount.toLocaleString()}원`} />
        <MetricCard label="사용 마일리지" value={`${totals.usedMileageAmount.toLocaleString()}P`} />
        <MetricCard label="실제 결제액" value={`${totals.paymentAmount.toLocaleString()}원`} emphasized />
      </section>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-neutral-200 p-4">
          <BarChart3 className="size-5 text-neutral-500" />
          <h2 className="font-bold">기간별 매출</h2>
        </div>
        {isLoading ? (
          <p className="p-8 text-center text-sm text-neutral-500">매출 통계를 불러오고 있습니다.</p>
        ) : statistics.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">기간</th>
                  <th className="px-4 py-3 font-medium">주문</th>
                  <th className="px-4 py-3 font-medium">상품 매출</th>
                  <th className="px-4 py-3 font-medium">배송비</th>
                  <th className="px-4 py-3 font-medium">마일리지</th>
                  <th className="px-4 py-3 font-medium">실제 결제액</th>
                </tr>
              </thead>
              <tbody>
                {statistics.map((item) => (
                  <tr key={item.label} className="border-t border-neutral-200">
                    <td className="px-4 py-4 font-semibold">{item.label}</td>
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
    </div>
  )
}

function FilterSelect({ value, onChange }: { value: SalesStatisticsUnit; onChange: (value: SalesStatisticsUnit) => void }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold">집계 단위</span>
      <select value={value} className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm" onChange={(event) => onChange(event.currentTarget.value as SalesStatisticsUnit)}>
        <option value="DAILY">일별</option>
        <option value="MONTHLY">월별</option>
        <option value="YEARLY">연도별</option>
      </select>
    </label>
  )
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input type="date" value={value} required className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm" onChange={(event) => onChange(event.currentTarget.value)} />
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

function getInclusiveDayCount(from: string, to: string) {
  const start = Date.parse(`${from}T00:00:00Z`)
  const end = Date.parse(`${to}T00:00:00Z`)

  return Math.floor((end - start) / 86_400_000) + 1
}

function getStatisticsErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "매출 통계 요청을 처리하지 못했습니다."
}
