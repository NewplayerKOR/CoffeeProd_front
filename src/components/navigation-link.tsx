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
    const main = document.querySelector<HTMLElement>("main")
    if (!main) return
    event.preventDefault()
    main.tabIndex = -1
    main.focus({ preventScroll: true })
    main.scrollIntoView({ behavior: "instant", block: "start" })
  }}>본문 바로가기</a>
}
