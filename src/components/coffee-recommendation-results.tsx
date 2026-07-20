import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { ProductImage } from "@/app/products/product-image"
import type { CoffeeRecommendation } from "@/lib/api/coffee"

export function CoffeeRecommendationResults({
  recommendations,
}: {
  recommendations: CoffeeRecommendation[]
}) {
  if (recommendations.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-neutral-600">
          현재 조건에 맞는 판매 가능 상품이 없습니다.
        </p>
      </div>
    )
  }

  return (
    <section className="recommendation-results grid gap-px border-y border-neutral-200 bg-neutral-200 md:grid-cols-2">
      {recommendations.map((item) => (
        <Link
          key={item.productId}
          href={`/products/${item.productId}`}
          className="recommendation-card group overflow-hidden bg-white transition-colors"
        >
          <ProductImage
            src={item.imageUrl}
            alt={item.name}
            className="aspect-[16/9] w-full object-cover"
          />
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-neutral-500">
                  {item.categoryName} · {item.weightGrams}g
                </p>
                <h3 className="mt-2 text-lg font-bold">{item.name}</h3>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                <Sparkles className="size-3.5" />
                {item.recommendationScore}점
              </span>
            </div>

            <p className="mt-3 text-sm text-neutral-600">
              {item.coffeeProfileName}
              {item.processingMethodName
                ? ` · ${item.processingMethodName}`
                : ""}
            </p>

            {item.flavorNotes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.flavorNotes.slice(0, 4).map((note) => (
                  <span
                    key={note.flavorNoteId}
                    className="rounded-full border border-neutral-200 px-2 py-1 text-xs text-neutral-600"
                  >
                    {note.name}
                  </span>
                ))}
              </div>
            )}

            <ul className="mt-4 space-y-1 text-sm leading-6 text-neutral-700">
              {item.reasons.slice(0, 3).map((reason) => (
                <li key={reason}>· {reason}</li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
              <strong>{item.price.toLocaleString()}원</strong>
              <span className="flex items-center gap-1 text-sm font-medium text-neutral-500 group-hover:text-neutral-950">
                상품 보기
                <ArrowRight className="size-4" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </section>
  )
}
