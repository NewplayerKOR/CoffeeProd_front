"use client"

import Link from "next/link"
import { Info, X } from "lucide-react"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"

const STORAGE_KEY = "coffeeprod.portfolio-notice-dismissed"
const DISMISS_EVENT = "coffeeprod:portfolio-notice-dismissed"

export function PortfolioNoticeDialog() {
  const isDismissed = useSyncExternalStore(
    subscribeDismissedState,
    getDismissedState,
    getServerDismissedState
  )

  if (isDismissed) {
    return null
  }

  function dismiss() {
    window.sessionStorage.setItem(STORAGE_KEY, "true")
    window.dispatchEvent(new CustomEvent(DISMISS_EVENT))
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-notice-title"
      aria-describedby="portfolio-notice-description"
    >
      <section className="relative w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 text-neutral-950 shadow-2xl">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3"
          aria-label="안내 팝업 닫기"
          onClick={dismiss}
        >
          <X />
        </Button>

        <div className="flex size-11 items-center justify-center rounded-lg bg-neutral-100">
          <Info className="size-5 text-neutral-600" />
        </div>
        <p className="mt-5 text-sm font-medium text-neutral-500">
          Portfolio Notice
        </p>
        <h2 id="portfolio-notice-title" className="mt-2 text-2xl font-bold">
          포트폴리오 사이트 안내
        </h2>
        <p
          id="portfolio-notice-description"
          className="mt-4 text-sm leading-7 text-neutral-600"
        >
          본 사이트는 실제 판매 페이지가 아닌 포트폴리오 사이트입니다. 표시된
          상품과 결제 기능은 서비스 구현 예시이며 실제 판매 및 배송은 이루어지지
          않습니다.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" asChild>
            <Link href="/about" onClick={dismiss}>
              소개 보기
            </Link>
          </Button>
          <Button type="button" onClick={dismiss}>
            확인했습니다
          </Button>
        </div>
      </section>
    </div>
  )
}

function subscribeDismissedState(onStoreChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onStoreChange)
  window.addEventListener("storage", onStoreChange)

  return () => {
    window.removeEventListener(DISMISS_EVENT, onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

function getDismissedState() {
  return window.sessionStorage.getItem(STORAGE_KEY) === "true"
}

function getServerDismissedState() {
  return false
}
