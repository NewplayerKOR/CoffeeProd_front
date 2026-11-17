import type { Metadata } from "next"
import Link from "next/link"
import { UserPlus } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"

import { SignupForm } from "./signup-form"

export const metadata: Metadata = { title: "회원가입" }

export default function SignupPage() {
  return (
    <main className="auth-page min-h-screen bg-neutral-50 text-neutral-950">
      <div className="auth-shell mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Link href="/" className="site-wordmark col-start-2">
            CoffeeProd
          </Link>
          <div className="justify-self-end">
            <ThemeToggle />
          </div>
        </div>

        <section className="auth-panel rounded-lg border border-neutral-200 bg-white p-7 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-neutral-100">
              <UserPlus className="size-5" />
            </div>
            <h1 className="text-2xl font-bold">회원가입</h1>
            <p className="mt-2 text-sm text-neutral-600">
              이메일과 비밀번호로 CoffeeProd 계정을 만듭니다.
            </p>
          </div>

          <SignupForm />

          <p className="mt-6 text-center text-sm text-neutral-600">
            이미 계정이 있나요?{" "}
            <Link href="/login" className="font-semibold text-neutral-950">
              로그인
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
