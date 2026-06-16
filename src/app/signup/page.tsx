import Link from "next/link"
import { Coffee, UserPlus } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"

import { SignupForm } from "./signup-form"

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        {/* 로고를 누르면 메인 페이지로 이동합니다. */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <Coffee className="size-5" />
          CoffeeProd
        </Link>

        <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
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
