"use client"

import Link from "next/link"
import { Save, Sparkles, UserRound } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"

import {
  CoffeePreferenceFields,
  emptyCoffeePreferenceForm,
  type CoffeePreferenceFormState,
} from "@/components/coffee-preference-fields"
import { CoffeeRecommendationResults } from "@/components/coffee-recommendation-results"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { getStoredAuthTokens } from "@/lib/api/auth-token-storage"
import {
  getMyCoffeePreference,
  getMyCoffeeRecommendations,
  saveMyCoffeePreference,
  type CoffeeRecommendation,
  type CoffeeReference,
  type MemberCoffeePreference,
} from "@/lib/api/coffee"
import { ApiError } from "@/lib/api/types"
import {
  coffeePreferenceToForm,
  hasCoffeePreference,
  toCoffeePreferencePayload,
} from "@/lib/coffee-preference"

type PageStatus = "checking" | "guest" | "ready"

export function CoffeePreferenceView({
  initialProcessingMethods,
  initialReferenceError,
}: {
  initialProcessingMethods: CoffeeReference[]
  initialReferenceError: string | null
}) {
  const [status, setStatus] = useState<PageStatus>("checking")
  const [form, setForm] = useState<CoffeePreferenceFormState>(
    emptyCoffeePreferenceForm
  )
  const [preference, setPreference] = useState<MemberCoffeePreference | null>(
    null
  )
  const [recommendations, setRecommendations] = useState<
    CoffeeRecommendation[]
  >([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(initialReferenceError)
  const [messageTone, setMessageTone] = useState<"success" | "error">(
    "success"
  )

  useEffect(() => {
    let isActive = true

    if (!getStoredAuthTokens()) {
      Promise.resolve().then(() => {
        if (isActive) {
          setStatus("guest")
        }
      })

      return () => {
        isActive = false
      }
    }

    Promise.all([
      getMyCoffeePreference().catch(allowNotFound),
      getMyCoffeeRecommendations(6).catch(allowRecommendationNotFound),
    ])
      .then(([savedPreference, savedRecommendations]) => {
        if (!isActive) {
          return
        }

        setPreference(savedPreference)
        setRecommendations(savedRecommendations)

        if (savedPreference) {
          setForm(coffeePreferenceToForm(savedPreference))
        }

        setStatus("ready")
      })
      .catch((error) => {
        if (!isActive) {
          return
        }

        if (error instanceof ApiError && error.kind === "UNAUTHORIZED") {
          setStatus("guest")
          return
        }

        setMessageTone("error")
        setMessage(getCoffeeErrorMessage(error))
        setStatus("ready")
      })

    return () => {
      isActive = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = toCoffeePreferencePayload(form)

    if (!hasCoffeePreference(payload)) {
      setMessageTone("error")
      setMessage("저장할 취향을 한 가지 이상 선택해 주세요.")
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const savedPreference = await saveMyCoffeePreference(payload)
      const nextRecommendations = await getMyCoffeeRecommendations(6)

      setPreference(savedPreference)
      setForm(coffeePreferenceToForm(savedPreference))
      setRecommendations(nextRecommendations)
      setMessageTone("success")
      setMessage("내 커피 취향을 저장하고 추천 결과를 갱신했습니다.")
    } catch (error) {
      setMessageTone("error")
      setMessage(getCoffeeErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="account-page flex min-h-screen flex-col bg-neutral-50 text-neutral-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[1320px] flex-1 px-6 py-12">

        <section className="mb-8">
          <p className="editorial-kicker">My Coffee</p>
          <h1 className="mt-3 text-4xl font-bold">내 커피 취향</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            자주 찾는 커피의 기준을 저장하면 판매 가능한 상품을 같은 기준으로
            다시 추천받을 수 있습니다.
          </p>
        </section>

        {status === "checking" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
            저장된 취향을 확인하고 있습니다.
          </section>
        )}

        {status === "guest" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
              <UserRound className="size-6 text-neutral-500" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">로그인이 필요합니다.</h2>
            <p className="mt-3 text-sm text-neutral-600">
              취향 저장과 개인화 추천은 로그인 후 이용할 수 있습니다.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/login?redirect=/me/coffee-preference">로그인하기</Link>
            </Button>
          </section>
        )}

        {status === "ready" && (
          <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
            <form
              className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
              onSubmit={handleSubmit}
            >
              <div className="flex items-center gap-2">
                <Save className="size-5 text-neutral-500" />
                <h2 className="text-lg font-bold">
                  {preference ? "저장된 취향 수정" : "취향 저장"}
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                PUT 방식으로 전체 저장되므로 비워 둔 값은 선호 없음으로
                변경됩니다.
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
                  className={
                    messageTone === "success"
                      ? "mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700"
                      : "mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                  }
                  role={messageTone === "error" ? "alert" : "status"}
                >
                  {message}
                </p>
              )}

              <Button className="mt-5 w-full" type="submit" disabled={isSubmitting}>
                <Save data-icon="inline-start" />
                {isSubmitting ? "저장 중" : "저장하고 추천 갱신"}
              </Button>
            </form>

            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">
                    Personalized
                  </p>
                  <h2 className="mt-1 text-xl font-bold">내 추천 상품</h2>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/recommendations">
                    <Sparkles data-icon="inline-start" />
                    일회성 추천
                  </Link>
                </Button>
              </div>
              <CoffeeRecommendationResults recommendations={recommendations} />
            </section>
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}

function allowNotFound(error: unknown) {
  if (error instanceof ApiError && error.httpStatus === 404) {
    return null
  }

  throw error
}

function allowRecommendationNotFound(error: unknown) {
  if (error instanceof ApiError && error.httpStatus === 404) {
    return [] as CoffeeRecommendation[]
  }

  throw error
}

function getCoffeeErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "커피 취향 요청을 처리하지 못했습니다."
}
