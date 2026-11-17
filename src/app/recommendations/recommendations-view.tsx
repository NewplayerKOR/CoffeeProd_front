"use client"

import Link from "next/link"
import { AiRecommendation } from "./ai-recommendation"
import { RotateCcw, Save, Sparkles } from "lucide-react"
import { type FormEvent, useEffect, useRef, useState } from "react"

import {
  CoffeePreferenceFields,
  emptyCoffeePreferenceForm,
  type CoffeePreferenceFormState,
} from "@/components/coffee-preference-fields"
import { CoffeeRecommendationResults } from "@/components/coffee-recommendation-results"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { useSessionState } from "@/components/session-state-provider"
import { Button } from "@/components/ui/button"
import {
  getMyCoffeeRecommendations,
  recommendCoffee,
  type CoffeeRecommendation,
  type CoffeeReference,
} from "@/lib/api/coffee"
import { ApiError } from "@/lib/api/types"
import {
  hasCoffeePreference,
  toCoffeePreferencePayload,
} from "@/lib/coffee-preference"

export function RecommendationsView({
  initialProcessingMethods,
  initialReferenceError,
}: {
  initialProcessingMethods: CoffeeReference[]
  initialReferenceError: string | null
}) {
  const { status } = useSessionState()
  const [form, setForm] = useState<CoffeePreferenceFormState>(
    emptyCoffeePreferenceForm
  )
  const [recommendations, setRecommendations] = useState<
    CoffeeRecommendation[] | null
  >(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(initialReferenceError)
  const [resultStatus, setResultStatus] = useState("")
  const formRef = useRef<HTMLFormElement>(null)
  const resultHeadingRef = useRef<HTMLHeadingElement>(null)
  const requestPendingRef = useRef(false)
  const focusResultsRef = useRef(false)
  const isAuthenticated = status === "authenticated"

  useEffect(() => {
    if (!focusResultsRef.current || recommendations === null) return
    focusResultsRef.current = false
    resultHeadingRef.current?.focus({ preventScroll: true })
    resultHeadingRef.current?.scrollIntoView({ block: "start" })
  }, [recommendations])

  async function requestRecommendations(request: () => Promise<CoffeeRecommendation[]>) {
    if (requestPendingRef.current) return
    requestPendingRef.current = true
    setIsSubmitting(true)
    setMessage(null)
    setResultStatus("취향에 맞는 커피를 추천하고 있습니다.")
    const trigger = document.activeElement
    let shouldFocusResults = true
    function trackInteraction(event: Event) {
      if (event.target instanceof Node && !formRef.current?.contains(event.target)) {
        shouldFocusResults = false
      }
    }
    document.addEventListener("focusin", trackInteraction)
    document.addEventListener("pointerdown", trackInteraction)

    try {
      const results = await request()
      focusResultsRef.current = shouldFocusResults
      setRecommendations(results)
      setResultStatus(results.length > 0
        ? `${results.length}개의 추천을 찾았습니다. 아래 추천 결과를 확인해 주세요.`
        : "현재 조건에 맞는 판매 가능 상품이 없습니다. 조건을 바꿔 다시 추천받아 보세요.")
    } catch (error) {
      setMessage(getCoffeeErrorMessage(error))
      setResultStatus("")
      if (shouldFocusResults && document.activeElement === document.body && trigger instanceof HTMLElement) {
        // disabled 버튼이 다시 활성화된 뒤 원래 요청 위치로 복귀한다.
        requestAnimationFrame(() => {
          if (document.activeElement === document.body && trigger.isConnected) trigger.focus()
        })
      }
    } finally {
      document.removeEventListener("focusin", trackInteraction)
      document.removeEventListener("pointerdown", trackInteraction)
      requestPendingRef.current = false
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (requestPendingRef.current) return
    const payload = toCoffeePreferencePayload(form)

    if (!hasCoffeePreference(payload)) {
      setMessage("한 가지 이상의 취향을 선택해 주세요.")
      return
    }

    await requestRecommendations(() => recommendCoffee({ ...payload, limit: 6 }))
  }

  async function handleMyRecommendation() {
    await requestRecommendations(() => getMyCoffeeRecommendations(6))
  }

  function resetForm() {
    if (requestPendingRef.current) return
    setForm(emptyCoffeePreferenceForm)
    setRecommendations(null)
    setMessage(null)
    setResultStatus("")
  }

  return (
    <main className="recommendations-page min-h-screen bg-neutral-50 text-neutral-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[1320px] px-6 py-12">
        <section className="mb-10">
          <h1 className="text-4xl font-bold">내 취향에 맞는 커피 찾기</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            원하는 로스팅과 향미 강도를 선택하면 현재 판매 가능한 원두 중
            가까운 상품을 추천합니다.
          </p>
        </section>

        <AiRecommendation />

        <section className="recommendation-layout grid gap-8 lg:grid-cols-[390px_minmax(0,1fr)]">
          <form
            ref={formRef}
            id="preference-form"
            aria-busy={isSubmitting}
            className="recommendation-form h-fit border-y border-neutral-200 bg-white py-6"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-600" />
              <h2 className="text-lg font-bold">취향 조건</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              비워 둔 항목은 추천 조건에 포함하지 않습니다.
            </p>

            <div className="mt-5">
              <CoffeePreferenceFields
                value={form}
                processingMethods={initialProcessingMethods}
                disabled={isSubmitting}
                onChange={(nextForm) => {
                  setForm(nextForm)
                  setMessage(null)
                }}
              />
            </div>

            {message && (
              <p
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                role="alert"
              >
                {message}
              </p>
            )}

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button type="submit" disabled={isSubmitting}>
                <Sparkles data-icon="inline-start" />
                {isSubmitting ? "추천 중" : "추천 받기"}
              </Button>
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={resetForm}>
                <RotateCcw data-icon="inline-start" />
                초기화
              </Button>
              {isAuthenticated && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={handleMyRecommendation}
                >
                  <Save data-icon="inline-start" />
                  저장한 취향으로 추천
                </Button>
              )}
              <Button type="button" variant="ghost" asChild>
                <Link href={isAuthenticated ? "/me/coffee-preference" : "/login?redirect=/me/coffee-preference"}>
                  내 취향 관리
                </Link>
              </Button>
            </div>
          </form>

          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-500">Results</p>
                <h2
                  ref={resultHeadingRef}
                  tabIndex={-1}
                  className="mt-1 scroll-mt-24 text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  추천 결과{recommendations !== null ? ` ${recommendations.length}개` : ""}
                </h2>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/coffee-profiles">커피 프로필 보기</Link>
              </Button>
            </div>

            <p role="status" aria-atomic="true" className="mb-4 text-sm text-muted-foreground">
              {resultStatus}
            </p>

            <div aria-busy={isSubmitting}>
              {recommendations === null ? (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center text-sm leading-6 text-neutral-500">
                  취향 조건을 선택하면 추천 이유와 함께 상품을 보여드립니다.
                </div>
              ) : (
                <CoffeeRecommendationResults recommendations={recommendations} />
              )}
            </div>
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  )
}

function getCoffeeErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.httpStatus === 404) {
      return "저장된 취향이 없거나 추천 가능한 상품이 없습니다."
    }

    return error.message
  }

  return "커피 추천 요청을 처리하지 못했습니다."
}
