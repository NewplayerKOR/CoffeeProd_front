import { OrdersView } from "./orders-view"

type OrdersPageProps = {
  searchParams: Promise<{
    page?: string | string[]
  }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { page } = await searchParams
  const initialPage = parseNonNegativeInteger(firstParam(page)) ?? 0

  return <OrdersView initialPage={initialPage} />
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseNonNegativeInteger(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}
