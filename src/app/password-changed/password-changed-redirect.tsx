"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { useEffect } from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

export function PasswordChangedRedirect() {
  const router = useRouter()

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      router.replace("/login?redirect=/me")
    }, 1000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 text-neutral-950">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <section className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="size-6 text-green-700" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">비밀번호가 변경되었습니다</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          보안을 위해 다시 로그인해 주세요. 잠시 후 로그인 화면으로 이동합니다.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/login?redirect=/me">로그인으로 이동</Link>
        </Button>
      </section>
    </main>
  )
}
