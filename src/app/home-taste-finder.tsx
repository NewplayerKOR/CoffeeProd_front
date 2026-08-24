"use client"

import Link from "next/link"
import { ArrowRight, Coffee, Sparkles } from "lucide-react"
import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import type { ProductListItem, RoastLevel } from "@/lib/api/catalog"
import {
  recommendCoffee,
  type BeanType,
  type CoffeeRecommendation,
} from "@/lib/api/coffee"
import { ApiError } from "@/lib/api/types"
import { getRoastLevelLabel } from "@/lib/coffee-display"

import { ProductImage } from "./products/product-image"

type TasteState = {
  roastLevel: RoastLevel
  beanType: BeanType
  decaf: boolean
  preferredAcidity: number
  preferredBody: number
  preferredSweetness: number
  preferredAroma: number
}

const initialTaste: TasteState = {
  roastLevel: "MEDIUM",
  beanType: "SINGLE_ORIGIN",
  decaf: false,
  preferredAcidity: 4,
  preferredBody: 4,
  preferredSweetness: 3,
  preferredAroma: 4,
}

export function HomeTasteFinder({
  initialProduct,
}: {
  initialProduct: ProductListItem | null
}) {
  const [taste, setTaste] = useState(initialTaste)
  const [recommendation, setRecommendation] =
    useState<CoffeeRecommendation | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const recommendations = await recommendCoffee({ ...taste, limit: 1 })
      setRecommendation(recommendations[0] ?? null)
      setHasSearched(true)
    } catch (error) {
      setMessage(getRecommendationErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  function updateScore(
    field:
      | "preferredAcidity"
      | "preferredBody"
      | "preferredSweetness"
      | "preferredAroma",
    value: number
  ) {
    setTaste((current) => ({ ...current, [field]: value }))
    setMessage(null)
  }

  return (
    <section className="home-taste-section" aria-labelledby="taste-finder-title">
      <div className="home-section-heading">
        <div>
          <p className="editorial-kicker">Taste Finder</p>
          <h2 id="taste-finder-title">오늘의 취향을 골라보세요</h2>
        </div>
        <p>
          산미와 바디, 향의 균형으로 나에게 맞는 원두를 찾습니다.
        </p>
      </div>

      <div className="home-taste-layout">
        <form className="home-taste-form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>로스트 레벨</legend>
            <div className="taste-segmented-control">
              {(["LIGHT", "MEDIUM", "DARK"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={taste.roastLevel === level}
                  onClick={() =>
                    setTaste((current) => ({
                      ...current,
                      roastLevel: level,
                    }))
                  }
                >
                  {getRoastLevelLabel(level)}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="taste-choice-row">
            <fieldset>
              <legend>원두 타입</legend>
              <div className="taste-segmented-control">
                <button
                  type="button"
                  aria-pressed={taste.beanType === "SINGLE_ORIGIN"}
                  onClick={() =>
                    setTaste((current) => ({
                      ...current,
                      beanType: "SINGLE_ORIGIN",
                    }))
                  }
                >
                  싱글 오리진
                </button>
                <button
                  type="button"
                  aria-pressed={taste.beanType === "BLEND"}
                  onClick={() =>
                    setTaste((current) => ({
                      ...current,
                      beanType: "BLEND",
                    }))
                  }
                >
                  블렌드
                </button>
              </div>
            </fieldset>

            <label className="taste-toggle">
              <span>디카페인</span>
              <input
                type="checkbox"
                checked={taste.decaf}
                onChange={(event) =>
                  setTaste((current) => ({
                    ...current,
                    decaf: event.currentTarget.checked,
                  }))
                }
              />
              <span aria-hidden="true" />
            </label>
          </div>

          <div className="taste-score-grid">
            <TasteScore
              label="산미"
              value={taste.preferredAcidity}
              onChange={(value) => updateScore("preferredAcidity", value)}
            />
            <TasteScore
              label="바디"
              value={taste.preferredBody}
              onChange={(value) => updateScore("preferredBody", value)}
            />
            <TasteScore
              label="단맛"
              value={taste.preferredSweetness}
              onChange={(value) => updateScore("preferredSweetness", value)}
            />
            <TasteScore
              label="향"
              value={taste.preferredAroma}
              onChange={(value) => updateScore("preferredAroma", value)}
            />
          </div>

          {message ? (
            <p className="taste-error" role="alert">
              {message}
            </p>
          ) : null}

          <div className="taste-form-actions">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              <Sparkles data-icon="inline-start" />
              {isSubmitting ? "커피를 찾는 중" : "내 커피 찾기"}
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href="/recommendations">
                추천 화면 열기
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </form>

        <TasteMatch
          recommendation={recommendation}
          initialProduct={initialProduct}
          hasSearched={hasSearched}
        />
      </div>
    </section>
  )
}

function TasteScore({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="taste-score">
      <span>
        <strong>{label}</strong>
        <output>{value}</output>
      </span>
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={value}
        aria-label={`${label} 선호도`}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      <span className="taste-score-marks" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </label>
  )
}

function TasteMatch({
  recommendation,
  initialProduct,
  hasSearched,
}: {
  recommendation: CoffeeRecommendation | null
  initialProduct: ProductListItem | null
  hasSearched: boolean
}) {
  if (hasSearched && !recommendation) {
    return (
      <div className="taste-match-empty">
        <Coffee />
        <h3>조건에 맞는 원두가 없습니다</h3>
        <p>선호 강도나 원두 타입을 바꿔 다시 찾아보세요.</p>
      </div>
    )
  }

  const href = recommendation
    ? `/products/${recommendation.productId}`
    : initialProduct
      ? `/products/${initialProduct.id}`
      : "/products"
  const name = recommendation?.name ?? initialProduct?.name ?? "CoffeeProd 셀렉션"
  const imageUrl = recommendation?.imageUrl ?? initialProduct?.imageUrl ?? null
  const price = recommendation?.price ?? initialProduct?.price ?? null
  const profileName =
    recommendation?.coffeeProfileName ??
    initialProduct?.coffeeProfileName ??
    "취향 추천을 시작해 보세요"
  const weightGrams = recommendation?.weightGrams ?? initialProduct?.weightGrams

  return (
    <Link href={href} className="taste-match" aria-label={`${name} 상품 보기`}>
      <div className="taste-match-image">
        <ProductImage
          key={imageUrl ?? "taste-match-fallback"}
          src={imageUrl}
          alt={name}
          sizes="(max-width: 700px) 120px, 220px"
        />
      </div>
      <div className="taste-match-copy">
        <div className="taste-match-score">
          <strong>
            {recommendation
              ? `${Math.round(recommendation.recommendationScore)}점`
              : "Pick"}
          </strong>
          <span>{recommendation ? "추천 점수" : "오늘의 추천"}</span>
        </div>
        <p className="taste-match-profile">{profileName}</p>
        <h3>{name}</h3>
        {recommendation?.flavorNotes.length ? (
          <p className="taste-match-notes">
            {recommendation.flavorNotes
              .slice(0, 3)
              .map((note) => note.name)
              .join(" · ")}
          </p>
        ) : null}
        <div className="taste-match-meta">
          {weightGrams ? <span>{weightGrams}g</span> : null}
          {price !== null ? <strong>{price.toLocaleString()}원</strong> : null}
          <ArrowRight />
        </div>
      </div>
    </Link>
  )
}

function getRecommendationErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "추천 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."
}
