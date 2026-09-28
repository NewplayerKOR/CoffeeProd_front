import { formatOrderDateTime } from "@/lib/order-date-time"

export function OrderDateTime({ value }: { value: string }) {
  const formatted = formatOrderDateTime(value)

  if (formatted === null) {
    return <span>주문 일시 확인 필요</span>
  }

  return <time dateTime={value}>{formatted}</time>
}
