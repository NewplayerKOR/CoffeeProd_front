import Link from "next/link"
import { Coffee, Lock, Mail, ShieldCheck, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
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

          {/* 지금은 화면 연습용 form입니다. 실제 회원가입 API 연결은 나중에 추가합니다. */}
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
                  required
                  placeholder="coffee@example.com"
                  autoComplete="email"
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
                  required
                  minLength={8}
                  placeholder="8자 이상 입력하세요"
                  autoComplete="new-password"
                  className="h-10 w-full border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="passwordConfirm"
                className="mb-2 block text-sm font-medium text-neutral-800"
              >
                비밀번호 확인
              </label>

              <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3">
                <ShieldCheck className="size-4 text-neutral-400" />
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  required
                  minLength={8}
                  placeholder="비밀번호를 한 번 더 입력하세요"
                  autoComplete="new-password"
                  className="h-10 w-full border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* 약관 동의 영역입니다. required를 붙이면 체크하지 않았을 때 브라우저가 기본 검사를 해줍니다. */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
              <label className="flex gap-3">
                <input type="checkbox" required className="mt-0.5 size-4" />
                <span>
                  <span className="font-medium text-neutral-950">필수 약관에 동의합니다.</span>
                  <span className="mt-1 block leading-6 text-neutral-600">
                    CoffeeProd의{" "}
                    <Link href="/terms" className="font-medium text-neutral-950">
                      이용약관
                    </Link>
                    과{" "}
                    <Link href="/privacy" className="font-medium text-neutral-950">
                      개인정보처리방침
                    </Link>
                    을 확인했습니다.
                  </span>
                </span>
              </label>
            </div>

            <Button type="submit" className="mt-2 w-full">
              회원가입
            </Button>
          </form>

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