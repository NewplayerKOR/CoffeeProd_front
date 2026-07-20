import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

type AdminPageShellProps = {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}

export function AdminPageShell({
  eyebrow = "Admin",
  title,
  description,
  actions,
  children,
}: AdminPageShellProps) {
  return (
    <main className="admin-shell min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-[1320px] px-6 py-10">
        <header className="admin-header mb-12 flex flex-col gap-4 border-b border-neutral-200 pb-5 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="site-wordmark flex items-baseline gap-3">
            CoffeeProd
            <span className="font-sans text-[11px] font-semibold uppercase text-neutral-500">
              Admin console
            </span>
          </Link>

          <nav className="flex flex-wrap gap-2" aria-label="관리자 메뉴">
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <LayoutDashboard data-icon="inline-start" />
                관리자 홈
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft data-icon="inline-start" />
                메인으로
              </Link>
            </Button>
          </nav>
        </header>

        <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="editorial-kicker">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-bold">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
              {description}
            </p>
          </div>
          {actions}
        </section>

        {children}
      </div>
    </main>
  )
}
