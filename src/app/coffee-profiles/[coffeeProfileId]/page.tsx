import Link from "next/link"
import { ArrowLeft, Coffee, ShoppingBag, Sparkles } from "lucide-react"
import { notFound } from "next/navigation"

import { CartNavButton } from "@/app/cart/cart-nav-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { getCoffeeProfile, type CoffeeProfile } from "@/lib/api/coffee"
import { ApiError } from "@/lib/api/types"
import { getBeanTypeLabel, getRoastLevelLabel } from "@/lib/coffee-display"

type CoffeeProfileDetailPageProps = {
  params: Promise<{ coffeeProfileId: string }>
}

export default async function CoffeeProfileDetailPage({
  params,
}: CoffeeProfileDetailPageProps) {
  const { coffeeProfileId } = await params
  const profile = await loadProfile(coffeeProfileId)

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Coffee className="size-5" />
            CoffeeProd
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CartNavButton />
          </div>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/coffee-profiles">
              <ArrowLeft data-icon="inline-start" />
              프로필 목록
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/products?coffeeProfileId=${profile.id}`}>
              <ShoppingBag data-icon="inline-start" />
              연결 상품 보기
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/recommendations">
              <Sparkles data-icon="inline-start" />
              취향 추천
            </Link>
          </Button>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                {getBeanTypeLabel(profile.beanType)}
              </span>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                {getRoastLevelLabel(profile.roastLevel)}
              </span>
              {profile.decaf && (
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                  디카페인
                </span>
              )}
            </div>
            <h1 className="mt-5 text-3xl font-bold">{profile.profileName}</h1>
            <p className="mt-4 text-sm leading-7 text-neutral-600">
              {profile.summary || "등록된 프로필 설명이 없습니다."}
            </p>

            <section className="mt-8">
              <h2 className="text-lg font-bold">향미 노트</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {profile.flavorNotes.map((note) => (
                  <InfoItem
                    key={note.flavorNoteId}
                    label={note.name}
                    value={`강도 ${note.intensity} / 5`}
                  />
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-bold">추천 추출법</h2>
              <div className="mt-4 space-y-3">
                {profile.brewMethods.map((method) => (
                  <div
                    key={method.brewMethodId}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <strong className="text-sm">{method.name}</strong>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      {method.recommendationNote || method.description || "추출 안내 없음"}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {profile.components.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-bold">블렌드 구성</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {profile.components.map((component, index) => (
                    <InfoItem
                      key={`${component.originCountryCode}-${index}`}
                      label={`${component.originCountryCode}${component.originRegion ? ` · ${component.originRegion}` : ""}`}
                      value={
                        component.componentRatio === null
                          ? component.processingMethod?.name || "구성 비율 미지정"
                          : `${component.componentRatio}%${component.processingMethod ? ` · ${component.processingMethod.name}` : ""}`
                      }
                    />
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="h-fit space-y-4">
            <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">감각 점수</h2>
              <div className="mt-5 space-y-4">
                <ScoreBar label="산미" value={profile.acidity} />
                <ScoreBar label="바디" value={profile.body} />
                <ScoreBar label="단맛" value={profile.sweetness} />
                <ScoreBar label="향" value={profile.aroma} />
              </div>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">프로필 정보</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <DetailRow label="가공 방식" value={profile.processingMethod?.name || "미지정"} />
                <DetailRow label="원산지" value={getOriginLabel(profile)} />
                <DetailRow label="농장/조합" value={profile.farmOrCooperative || "-"} />
                <DetailRow label="생산자" value={profile.producer || "-"} />
                <DetailRow label="고도" value={getAltitudeLabel(profile)} />
                <DetailRow
                  label="품종"
                  value={profile.varieties.map((item) => item.name).join(", ") || "-"}
                />
              </dl>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}

async function loadProfile(coffeeProfileId: string) {
  try {
    return await getCoffeeProfile(coffeeProfileId)
  } catch (error) {
    if (error instanceof ApiError && error.httpStatus === 404) {
      notFound()
    }

    throw error
  }
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-sm text-neutral-500">{value}</p>
    </div>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-neutral-500">{value} / 5</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full bg-neutral-950" style={{ width: `${value * 20}%` }} />
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

function getOriginLabel(profile: CoffeeProfile) {
  if (profile.beanType === "BLEND") {
    return "블렌드 구성 참조"
  }

  return [profile.originCountryCode, profile.originRegion]
    .filter(Boolean)
    .join(" · ") || "-"
}

function getAltitudeLabel(profile: CoffeeProfile) {
  if (profile.altitudeMin === null && profile.altitudeMax === null) {
    return "-"
  }

  if (profile.altitudeMin === profile.altitudeMax) {
    return `${profile.altitudeMin}m`
  }

  return `${profile.altitudeMin ?? "?"}-${profile.altitudeMax ?? "?"}m`
}
