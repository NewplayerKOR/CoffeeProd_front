import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

import { LoginForm } from "./login-form"

type LoginPageProps = {
  searchParams: Promise<{
    signup?: string
    redirect?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { signup, redirect } = await searchParams
  const redirectTo = parseRedirectPath(redirect)

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
            <p className="editorial-kicker">Welcome back</p>
            <h1 className="text-2xl font-bold">로그인</h1>
            <p className="mt-2 text-sm text-neutral-600">
              CoffeeProd 계정으로 로그인하세요.
            </p>
          </div>

          <LoginForm signupSuccess={signup === "success"} redirectTo={redirectTo} />

          <p className="mt-6 text-center text-sm text-neutral-600">
            아직 계정이 없나요?{" "}
            <Link href="/signup" className="font-semibold text-neutral-950">
              회원가입
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-neutral-500">
          로그인하면 CoffeeProd의{" "}
          <Link href="/terms" className="font-medium text-neutral-700 hover:text-neutral-950">
            이용약관
          </Link>{" "}
          및{" "}
          <Link href="/privacy" className="font-medium text-neutral-700 hover:text-neutral-950">
            개인정보처리방침
          </Link>
          에 동의한 것으로 간주됩니다.
        </p>
      </div>
    </main>
  )
}

function parseRedirectPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/"
  }

  return value
}
