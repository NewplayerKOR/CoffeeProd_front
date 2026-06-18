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

export function getSalesStatistics(params: SalesStatisticsParams) {
  return apiRequest<SalesStatistics[]>("/api/v1/admin/statistics/sales", {
    query: params as QueryParams,
  })
}

export function aggregateSalesStatistics(statDate: string) {
  return apiRequest<null>("/api/v1/admin/statistics/sales/aggregate", {
    method: "POST",
    query: { statDate },
  })
}
