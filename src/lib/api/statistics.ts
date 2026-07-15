import { apiRequest, type QueryParams } from "./client"

export type SalesStatisticsUnit = "DAILY" | "MONTHLY" | "YEARLY"

export type SalesStatistics = {
  label: string
  orderCount: number
  productSalesAmount: number
  deliveryFeeAmount: number
  usedMileageAmount: number
  paymentAmount: number
}

export type SalesStatisticsParams = {
  unit: SalesStatisticsUnit
  from: string
  to: string
}

export type AggregateSalesRangeResponse = {
  from: string
  to: string
  aggregatedDays: number
}

export function getSalesStatistics(params: SalesStatisticsParams) {
  return apiRequest<SalesStatistics[]>("/api/v1/admin/statistics/sales", {
    cache: "no-store",
    query: params as QueryParams,
  })
}

export function aggregateSalesStatisticsRange(from: string, to: string) {
  return apiRequest<AggregateSalesRangeResponse>(
    "/api/v1/admin/statistics/sales/aggregate/range",
    {
    method: "POST",
      query: { from, to },
    }
  )
}
