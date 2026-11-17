"use client"

import Link from "next/link"
import { useLayoutEffect, useRef, type ReactNode } from "react"

import { Button } from "@/components/ui/button"

export function ProductDetailPanels({
  productId,
  selectedTab,
  items,
  children,
}: {
  productId: number
  selectedTab: string
  items: readonly { id: string; label: string }[]
  children: ReactNode
}) {
  const contentRef = useRef<HTMLDivElement>(null)

  function focusContent() {
    const content = contentRef.current
    if (!content) return
    const target = content.querySelector<HTMLElement>("h2") ?? content
    target.tabIndex = -1
    target.classList.add("skip-content-target")
    target.focus({ preventScroll: true })
    target.scrollIntoView({ behavior: "instant", block: "start" })
  }

  useLayoutEffect(() => {
    if (selectedTab !== "detail" || new URLSearchParams(location.search).has("tab") || location.hash === "#product-detail-content") {
      focusContent()
    }
  }, [productId, selectedTab])

  return (
    <section className="mt-10 rounded-lg border border-neutral-200 bg-white shadow-sm">
      <nav className="flex flex-wrap gap-2 border-b border-neutral-200 p-4" aria-label="상품 상세 내용">
        {items.map((item) => {
          const isActive = selectedTab === item.id
          const href = item.id === "detail"
            ? `/products/${productId}#product-detail-content`
            : `/products/${productId}?tab=${item.id}#product-detail-content`

          return (
            <Button key={item.id} variant={isActive ? "default" : "ghost"} size="sm" asChild>
              <Link
                href={href}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className="aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
                onNavigate={() => { if (isActive) focusContent() }}
              >
                {item.label}
              </Link>
            </Button>
          )
        })}
      </nav>
      <div id="product-detail-content" ref={contentRef} tabIndex={-1} className="scroll-mt-24 p-6">
        {children}
      </div>
    </section>
  )
}
