import Link from "next/link"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  getBrewMethods,
  getCoffeeProfiles,
  getCoffeeVarieties,
  getFlavorNotes,
  getProcessingMethods,
  type CoffeeReference,
} from "@/lib/api/coffee"
import { ApiError } from "@/lib/api/types"
import { getBeanTypeLabel, getRoastLevelLabel } from "@/lib/coffee-display"

type CoffeeProfilesPageProps = {
  searchParams: Promise<{ page?: string | string[] }>
}

export default async function CoffeeProfilesPage({
  searchParams,
}: CoffeeProfilesPageProps) {
  const rawSearchParams = await searchParams
  const page = parsePage(rawSearchParams.page)
  const result = await loadProfiles(page)

  return (
    <main className="profiles-page min-h-screen bg-neutral-50 text-neutral-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[1320px] px-6 py-12">
        <section className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="editorial-kicker">Coffee Profiles</p>
            <h1 className="mt-3 text-4xl font-bold">커피를 이해하는 기준</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
              원산지와 가공 방식, 향미와 추천 추출법으로 CoffeeProd의 원두
              기준을 살펴봅니다.
            </p>
          </div>
          <Button asChild>
            <Link href="/recommendations">
              <Sparkles data-icon="inline-start" />
              취향 추천 받기
            </Link>
          </Button>
        </section>

        <section className="mb-8 border-y border-neutral-200 py-6">
          <div className="mb-4">
            <p className="text-sm font-medium text-neutral-500">Coffee Data</p>
            <h2 className="mt-1 text-xl font-bold">커피 데이터 가이드</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ReferenceGroup title="가공 방식" references={result.references.processingMethods} />
            <ReferenceGroup title="향미" references={result.references.flavorNotes} />
            <ReferenceGroup title="추천 추출" references={result.references.brewMethods} />
            <ReferenceGroup title="품종" references={result.references.varieties} />
          </div>
        </section>

        {result.error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {result.error}
          </p>
        ) : (
          <>
            <section className="profile-card-grid grid gap-px border-y border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
              {result.data?.content.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/coffee-profiles/${profile.id}`}
                  className="group flex min-h-64 flex-col bg-white p-6 transition-colors hover:bg-neutral-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                      {getBeanTypeLabel(profile.beanType)}
                    </span>
                    <span className="text-xs font-medium text-neutral-500">
                      {getRoastLevelLabel(profile.roastLevel)}
                    </span>
                  </div>
                  <h2 className="mt-5 text-lg font-bold">{profile.profileName}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-600">
                    {profile.summary || "향미와 추출 정보를 확인해 보세요."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {profile.flavorNotes.slice(0, 3).map((note) => (
                      <span
                        key={note.flavorNoteId}
                        className="rounded-full border border-neutral-200 px-2 py-1 text-xs text-neutral-500"
                      >
                        {note.name}
                      </span>
                    ))}
                  </div>
                  <span className="mt-auto flex items-center gap-1 pt-5 text-sm font-medium text-neutral-500 group-hover:text-neutral-950">
                    자세히 보기
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              ))}
            </section>

            {result.data?.content.length === 0 && (
              <p className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
                등록된 커피 프로필이 없습니다.
              </p>
            )}

            {result.data && result.data.totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-2">
                <Button variant="outline" disabled={result.data.first} asChild={!result.data.first}>
                  {result.data.first ? (
                    <span>
                      <ArrowLeft data-icon="inline-start" /> 이전
                    </span>
                  ) : (
                    <Link href={`/coffee-profiles?page=${page - 1}`}>
                      <ArrowLeft data-icon="inline-start" /> 이전
                    </Link>
                  )}
                </Button>
                <span className="px-3 text-sm text-neutral-600">
                  {result.data.number + 1} / {result.data.totalPages}
                </span>
                <Button variant="outline" disabled={result.data.last} asChild={!result.data.last}>
                  {result.data.last ? (
                    <span>
                      다음 <ArrowRight data-icon="inline-end" />
                    </span>
                  ) : (
                    <Link href={`/coffee-profiles?page=${page + 1}`}>
                      다음 <ArrowRight data-icon="inline-end" />
                    </Link>
                  )}
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}

async function loadProfiles(page: number) {
  const [profiles, processingMethods, flavorNotes, brewMethods, varieties] =
    await Promise.allSettled([
      getCoffeeProfiles({ page, size: 12, sort: "createdAt,desc" }),
      getProcessingMethods(),
      getFlavorNotes(),
      getBrewMethods(),
      getCoffeeVarieties(),
    ])

  return {
    data: profiles.status === "fulfilled" ? profiles.value : null,
    error:
      profiles.status === "rejected"
        ? profiles.reason instanceof ApiError
          ? profiles.reason.message
          : "커피 프로필을 불러오지 못했습니다."
        : null,
    references: {
      processingMethods:
        processingMethods.status === "fulfilled" ? processingMethods.value : [],
      flavorNotes: flavorNotes.status === "fulfilled" ? flavorNotes.value : [],
      brewMethods: brewMethods.status === "fulfilled" ? brewMethods.value : [],
      varieties: varieties.status === "fulfilled" ? varieties.value : [],
    },
  }
}

function ReferenceGroup({
  title,
  references,
}: {
  title: string
  references: CoffeeReference[]
}) {
  return (
    <article>
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="mt-3 flex max-h-28 flex-wrap content-start gap-1.5 overflow-y-auto">
        {references.map((reference) => (
          <span
            key={reference.id}
            title={reference.description ?? reference.name}
            className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600"
          >
            {reference.name}
          </span>
        ))}
        {references.length === 0 && (
          <span className="text-xs text-neutral-400">등록 정보 없음</span>
        )}
      </div>
    </article>
  )
}

function parsePage(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0
}
