"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

export function NavigationLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname()
  const current = pathname === href || pathname.startsWith(`${href}/`)
  return <Link href={href} aria-current={current ? "page" : undefined}>{children}</Link>
}

export function SkipToContent() {
  return <a className="skip-to-content" href="#main-content" onClick={(event) => {
    const target = document.querySelector<HTMLElement>("main h1")
      ?? document.querySelector<HTMLElement>("main")
    if (!target) return
    event.preventDefault()
    target.tabIndex = -1
    target.classList.add("skip-content-target")
    target.focus({ preventScroll: true })
    target.scrollIntoView({ behavior: "instant", block: "start" })
  }}>본문 바로가기</a>
}
