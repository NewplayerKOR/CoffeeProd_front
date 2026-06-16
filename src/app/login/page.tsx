import Link from "next/link"
import { Coffee } from "lucide-react"

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
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        {/* 로그인 페이지 상단 로고 영역입니다. */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <Coffee className="size-5" />
          CoffeeProd
        </Link>

        {/* 로그인 박스입니다. 아직 shadcn Card를 설치하지 않았으므로 div와 Tailwind로 직접 구성합니다. */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">로그인</h1>
            <p className="mt-2 text-sm text-neutral-600">
              CoffeeProd 계정으로 로그인하세요.
            </p>
          </div>

          <LoginForm signupSuccess={signup === "success"} redirectTo={redirectTo} />

          {/* 일반 로그인과 OAuth 로그인을 시각적으로 분리하는 선입니다. */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs text-neutral-500">또는 [Oauth는 현재 미구현]</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          {/* OAuth 로그인 버튼 영역입니다. 실제 연동 전에는 UI만 만들어 둡니다. */}
          {/* <div className="grid gap-2">
            <Button variant="outline" type="button" className="w-full">
              <span className="flex size-4 items-center justify-center rounded-full bg-yellow-300 text-[10px] font-bold text-black">
                K
              </span>
              카카오로 로그인
            </Button>

            <Button variant="outline" type="button" className="w-full">
              <GitGraph className="size-4" />
              GitHub로 로그인
            </Button>

            <Button variant="outline" type="button" className="w-full">
              <span className="flex size-4 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white">
                N
              </span>
              네이버로 로그인
            </Button>
          </div> */}

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
