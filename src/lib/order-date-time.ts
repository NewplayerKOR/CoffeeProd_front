const orderDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

export function formatOrderDateTime(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) {
    return null
  }

  return `${orderDateFormatter.format(date)} (한국 시간)`
}
