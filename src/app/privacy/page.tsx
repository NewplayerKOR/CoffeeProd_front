import Link from "next/link"
import { ArrowLeft, Coffee } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-950">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Coffee className="size-5" />
            CoffeeProd
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft data-icon="inline-start" />
                메인으로
              </Link>
            </Button>
          </div>
        </header>

        <article className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Privacy</p>
          <h1 className="mt-2 text-3xl font-bold">개인정보처리방침</h1>
          <p className="mt-4 text-sm leading-6 text-neutral-600">
            본 문서는 CoffeeProd 예제 서비스의 개인정보 처리 방식을 설명하기
            위한 샘플 문서입니다.
          </p>

          <section className="mt-8 space-y-4 text-sm leading-7 text-neutral-700">
            <h2 className="text-lg font-bold text-neutral-950">수집 항목</h2>
            <p>
              회원가입과 주문 처리를 위해 이메일, 이름, 닉네임, 배송지,
              연락처, 주문 내역을 수집할 수 있습니다.
            </p>

            <h2 className="text-lg font-bold text-neutral-950">이용 목적</h2>
            <p>
              수집한 정보는 계정 식별, 주문 처리, 배송지 관리, 결제 승인 요청,
              고객 지원 목적으로 사용됩니다.
            </p>

            <h2 className="text-lg font-bold text-neutral-950">보관 및 파기</h2>
            <p>
              개인정보는 서비스 제공에 필요한 기간 동안 보관하며, 회원 탈퇴
              또는 보관 목적 달성 후 관련 법령과 정책에 따라 파기합니다.
            </p>

            <h2 className="text-lg font-bold text-neutral-950">결제 정보</h2>
            <p>
              카드번호와 같은 민감 결제 정보는 프론트엔드가 직접 저장하지
              않으며, 결제 승인에 필요한 값은 Toss Payments와 백엔드 승인
              API를 통해 처리합니다.
            </p>
          </section>
        </article>
      </div>
    </main>
  )
}
