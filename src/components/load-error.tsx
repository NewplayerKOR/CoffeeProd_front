"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/types"

export function LoadError({ title, error, onRetry, loginHref }: {
  title: string
  error: unknown
  onRetry: () => void
  loginHref?: string
}) {
  const expired = error instanceof ApiError && error.kind === "UNAUTHORIZED" && loginHref
  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-5" role="alert">
      <p className="font-semibold">{expired ? "로그인 상태를 다시 확인해 주세요." : title}</p>
      <p className="mt-2 text-sm text-neutral-600">
        {expired ? "다시 로그인한 뒤 이용해 주세요." : "연결 상태를 확인한 뒤 다시 시도해 주세요."}
      </p>
      {expired ? (
        <Button className="mt-4" asChild><Link href={loginHref}>로그인하기</Link></Button>
      ) : (
        <Button className="mt-4" type="button" variant="outline" onClick={onRetry}>다시 시도</Button>
      )}
    </div>
  )
}
