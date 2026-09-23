"use client"

import Link from "next/link"
import { Info, X } from "lucide-react"
import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react"

import { Button } from "@/components/ui/button"

const STORAGE_KEY = "coffeeprod.portfolio-notice-dismissed"
const DISMISS_EVENT = "coffeeprod:portfolio-notice-dismissed"

export function PortfolioNotice() {
  const noticeRef = useRef<HTMLElement | null>(null)
  const isDismissed = useSyncExternalStore(
    subscribeDismissedState,
    getDismissedState,
    getServerDismissedState
  )

  const dismiss = useCallback((restoreFocus: boolean) => {
    const shouldRestoreFocus =
      restoreFocus &&
      noticeRef.current?.contains(document.activeElement) === true

    window.sessionStorage.setItem(STORAGE_KEY, "true")
    window.dispatchEvent(new CustomEvent(DISMISS_EVENT))

    if (shouldRestoreFocus) {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(".site-wordmark")?.focus()
      })
    }
  }, [])

  useEffect(() => {
    if (isDismissed) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        dismiss(true)
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => window.removeEventListener("keydown", handleEscape)
  }, [dismiss, isDismissed])

  if (isDismissed) {
    return null
  }

  return (
    <aside
      ref={noticeRef}
      className="border-b border-border bg-muted/55 text-foreground"
      aria-labelledby="portfolio-notice-title"
    >
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-8">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <Info
            className="mt-0.5 size-4 shrink-0 text-muted-foreground sm:mt-0"
            aria-hidden="true"
          />
          <p id="portfolio-notice-title" className="text-sm leading-6">
            <strong className="font-semibold">포트폴리오 사이트 안내</strong>
            <span className="ml-2 text-muted-foreground">
              실제 판매와 배송은 이루어지지 않으며, 상품과 결제 기능은 서비스
              구현 예시입니다.
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1">
          <Button variant="link" size="sm" asChild>
            <Link href="/about" onClick={() => dismiss(false)}>
              서비스 소개
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="포트폴리오 안내 닫기"
            title="안내 닫기"
            onClick={() => dismiss(true)}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>
    </aside>
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
