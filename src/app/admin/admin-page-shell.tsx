import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Coffee, LayoutDashboard } from "lucide-react"

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
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-neutral-200 pb-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Coffee className="size-5" />
            CoffeeProd
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
            <p className="text-sm font-medium text-neutral-500">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold">{title}</h1>
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
