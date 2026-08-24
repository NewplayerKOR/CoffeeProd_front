import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export function SitePageLoading({ detail = false }: { detail?: boolean }) {
  return (
    <main className="flex min-h-screen flex-col bg-neutral-50 text-neutral-950">
      <SiteHeader />
      <div
        className="mx-auto w-full max-w-[1320px] flex-1 animate-pulse px-6 py-12"
        aria-busy="true"
      >
        <span className="sr-only">페이지를 불러오는 중입니다.</span>
        <div className="h-3 w-28 rounded-sm bg-neutral-200" />
        <div className="mt-4 h-10 w-full max-w-md rounded-sm bg-neutral-200" />
        <div className="mt-4 h-4 w-full max-w-xl rounded-sm bg-neutral-200" />

        {detail ? <DetailSkeleton /> : <ListSkeleton />}
      </div>
      <SiteFooter />
    </main>
  )
}

function ListSkeleton() {
  return (
    <div className="mt-12">
      <div className="h-12 w-full border-y border-neutral-200 bg-white" />
      <div className="mt-8 grid grid-cols-2 gap-px bg-neutral-200 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="bg-white">
            <div className="aspect-square bg-neutral-200 md:aspect-[4/3]" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-20 rounded-sm bg-neutral-200" />
              <div className="h-5 w-4/5 rounded-sm bg-neutral-200" />
              <div className="h-4 w-2/5 rounded-sm bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="mt-12 grid gap-8 md:grid-cols-2">
      <div className="aspect-square rounded-sm bg-neutral-200" />
      <div className="space-y-5 border-y border-neutral-200 bg-white p-6">
        <div className="h-4 w-24 rounded-sm bg-neutral-200" />
        <div className="h-9 w-4/5 rounded-sm bg-neutral-200" />
        <div className="h-4 w-full rounded-sm bg-neutral-200" />
        <div className="h-4 w-3/4 rounded-sm bg-neutral-200" />
        <div className="mt-10 h-11 w-full rounded-sm bg-neutral-200" />
      </div>
    </div>
  )
}
