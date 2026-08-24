"use client"

import Link from "next/link"
import { RotateCcw, Save, Sparkles } from "lucide-react"
import { type FormEvent, useState } from "react"

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
  const isAuthenticated = status === "authenticated"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = toCoffeePreferencePayload(form)

    if (!hasCoffeePreference(payload)) {
      setMessage("한 가지 이상의 취향을 선택해 주세요.")
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      setRecommendations(await recommendCoffee({ ...payload, limit: 6 }))
    } catch (error) {
      setMessage(getCoffeeErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleMyRecommendation() {
    setIsSubmitting(true)
    setMessage(null)

    try {
      setRecommendations(await getMyCoffeeRecommendations(6))
    } catch (error) {
      setMessage(getCoffeeErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setForm(emptyCoffeePreferenceForm)
    setRecommendations(null)
    setMessage(null)
  }

  return (
    <main className="recommendations-page min-h-screen bg-neutral-50 text-neutral-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[1320px] px-6 py-12">
        <section className="mb-10">
          <p className="editorial-kicker">Taste Finder</p>
          <h1 className="mt-3 text-4xl font-bold">내 취향에 맞는 커피 찾기</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            원하는 로스팅과 향미 강도를 선택하면 현재 판매 가능한 원두 중
            가까운 상품을 추천합니다.
          </p>
        </section>

        <section className="recommendation-layout grid gap-8 lg:grid-cols-[390px_minmax(0,1fr)]">
          <form
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
              <Button type="button" variant="outline" onClick={resetForm}>
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
                <h2 className="mt-1 text-xl font-bold">추천 결과</h2>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/coffee-profiles">커피 프로필 보기</Link>
              </Button>
            </div>

            {recommendations === null ? (
              <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center text-sm leading-6 text-neutral-500">
                취향 조건을 선택하면 추천 이유와 함께 상품을 보여드립니다.
              </div>
            ) : (
              <CoffeeRecommendationResults recommendations={recommendations} />
            )}
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
