"use client"

import Link from "next/link"
import { type FormEvent, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSessionState } from "@/components/session-state-provider"
import { apiRequest } from "@/lib/api/client"
import { ApiError } from "@/lib/api/types"

type Recommendation = {
  productId: number
  name: string
  price: number
  stockQuantity: number
  weightGrams: number
  href: string
  reasons: string[]
}

export function AiRecommendation() {
  const { status, member } = useSessionState()
  const [preference, setPreference] = useState("")
  const [result, setResult] = useState<{ memberId: number; items: Recommendation[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pending = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const authenticated = status === "authenticated" && member !== null
  const visible = authenticated && result?.memberId === member.id ? result.items : null

  useEffect(() => {
    if (result) heading.current?.focus()
  }, [result])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!authenticated || pending.current) return
    if (!preference.trim()) {
      setError("원하는 커피 취향을 입력해 주세요.")
      return
    }
    pending.current = true
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const items = await apiRequest<Recommendation[]>("/api/v1/coffee-recommendations/ai", {
        method: "POST", body: { preference: preference.trim() }, cache: "no-store",
        retryOnUnauthorized: false,
      })
      setResult({ memberId: member.id, items })
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "AI 추천을 받지 못했습니다. 아래 취향 조건을 이용해 주세요.")
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="ai-title" className="mb-10 rounded-xl border border-amber-200 bg-amber-50/50 p-5 sm:p-7">
      <h2 id="ai-title" className="text-xl font-bold">말로 찾는 AI 커피 추천</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">“산미는 적고 고소한 커피, 우유와 함께 마시고 싶어요”처럼 취향을 적어 주세요. 현재 판매 중인 원두를 최대 5개 추천합니다.</p>
      {authenticated ? (
        <form onSubmit={submit} aria-labelledby="ai-title" className="mt-5 space-y-3">
          <label htmlFor="ai-preference" className="block text-sm font-semibold">원하는 커피 취향 (필수)</label>
          <textarea id="ai-preference" name="preference" required maxLength={1000} rows={3} value={preference}
            onChange={(event) => { setPreference(event.target.value); setError(null) }}
            aria-describedby="ai-help" disabled={busy}
            className="block w-full resize-y rounded-lg border border-neutral-400 bg-white p-3 text-base leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" />
          <p id="ai-help" className="text-xs leading-5 text-neutral-600">1,000자 이내 · 분당 2회, 하루 20회. 취향 문장과 상품 속성을 외부 AI에 전달합니다. 이름·이메일 등 개인정보는 입력하지 마세요.</p>
          <Button type="submit" disabled={busy} className="min-h-12">{busy ? "AI가 원두를 고르고 있습니다…" : "AI 추천 받기"}</Button>
        </form>
      ) : (
        <p className="mt-4 text-sm leading-6">{status === "checking" ? "로그인 상태를 확인하고 있습니다." : <>AI 추천은 로그인한 회원이 이용할 수 있습니다. <Link className="font-semibold underline underline-offset-4" href="/login?redirect=/recommendations">로그인하기</Link>. 아래 취향 조건 추천은 누구나 이용할 수 있습니다.</>}</p>
      )}
      <p role="status" className="mt-3 text-sm text-neutral-600">{busy ? "잠시만 기다려 주세요. 취향 조건 추천도 계속 이용할 수 있습니다." : visible ? `${visible.length}개의 추천을 찾았습니다. 추천 속성과 현재 상품 정보를 확인해 주세요.` : ""}</p>
      {error && authenticated ? <p role="alert" className="mt-3 text-sm font-medium text-red-800">{error} <a href="#preference-form" className="underline underline-offset-4">취향 조건으로 추천받기</a></p> : null}
      {visible ? <div className="mt-5">
        <h3 ref={heading} tabIndex={-1} className="text-lg font-bold focus-visible:outline-2">AI 추천 결과</h3>
        <p className="mt-1 text-xs leading-5 text-neutral-600">AI가 고른 추천 속성입니다. 상품 등록 정보를 바탕으로 표시하며 구매 시 가격과 재고를 다시 확인합니다.</p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => <li key={item.productId} className="rounded-lg border border-neutral-200 bg-white p-5">
            <Link href={`/products/${item.productId}`} className="text-base font-bold underline-offset-4 hover:underline">{item.name}</Link>
            <p className="mt-2 text-sm">{item.weightGrams}g · {item.price.toLocaleString()}원</p>
            <ul className="mt-3 space-y-1 text-sm text-neutral-700">{item.reasons.map((reason) => <li key={reason}>· {reason}</li>)}</ul>
          </li>)}
        </ul>
      </div> : null}
    </section>
  )
}
