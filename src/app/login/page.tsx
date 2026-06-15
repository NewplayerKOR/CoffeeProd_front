import Link from "next/link"
import { Coffee, Lock, Mail, GitGraph } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
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

          {/* 지금은 화면 연습용 form입니다. 실제 로그인 API 연결은 나중에 추가합니다. */}
          <form className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-neutral-800"
              >
                이메일
              </label>

              <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3">
                <Mail className="size-4 text-neutral-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="coffee@example.com"
                  className="h-10 w-full border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-neutral-800"
              >
                비밀번호
              </label>

              <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3">
                <Lock className="size-4 text-neutral-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  className="h-10 w-full border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-neutral-600">
                <input type="checkbox" className="size-4" />
                로그인 유지
              </label>

              <Link href="/forgot-password" className="font-medium hover:text-neutral-950">
                비밀번호 찾기
              </Link>
            </div>

            <Button type="submit" className="mt-2 w-full">
              로그인
            </Button>
          </form>

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
          로그인하면 CoffeeProd의 이용약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
        </p>
      </div>
    </main>
  )
}