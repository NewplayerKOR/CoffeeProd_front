"use client"

import { useCallback, useEffect, useState } from "react"

// 이전 조회는 페이지 제어에만 쓰고, 본문에는 현재 요청의 완료 결과만 제공한다.
export function useRemoteQuery<T>(key: string, load: () => Promise<T>) {
  const [request, setRequest] = useState({ key, revision: 0 })
  if (request.key !== key) {
    setRequest({ key, revision: request.revision + 1 })
  }
  const requestKey = `${key}:${request.revision}`
  const [result, setResult] = useState<{
    key: string
    data: T | null
    error: unknown
  } | null>(null)

  useEffect(() => {
    let active = true
    void load().then(
      (data) => { if (active) setResult({ key: requestKey, data, error: null }) },
      (error: unknown) => { if (active) setResult({ key: requestKey, data: null, error }) }
    )
    return () => { active = false }
  }, [load, requestKey])

  const reload = useCallback(() => setRequest((current) => ({
    ...current, revision: current.revision + 1,
  })), [])
  const current = result?.key === requestKey ? result : null
  return {
    data: current?.data ?? null,
    previousData: result?.data ?? null,
    error: current?.error ?? null,
    isLoading: current === null,
    reload,
  }
}
