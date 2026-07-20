import Link from "next/link"
import { UserPlus } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"

import { SignupForm } from "./signup-form"

export default function SignupPage() {
  return (
    <main className="auth-page min-h-screen bg-neutral-50 text-neutral-950">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="auth-shell mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <Link href="/" className="site-wordmark mb-8 self-center">
          CoffeeProd
        </Link>

        <section className="auth-panel rounded-lg border border-neutral-200 bg-white p-7 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-neutral-100">
              <UserPlus className="size-5" />
            </div>
            <p className="editorial-kicker">Create account</p>
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
