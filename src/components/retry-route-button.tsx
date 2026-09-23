"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"

export function RetryRouteButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RotateCw data-icon="inline-start" aria-hidden="true" />
      {isPending ? "다시 불러오는 중" : "다시 시도"}
    </Button>
  )
}
