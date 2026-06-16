import Link from "next/link"
import { ArrowLeft, Coffee } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function TermsPage() {
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
          <p className="text-sm font-medium text-neutral-500">Terms</p>
          <h1 className="mt-2 text-3xl font-bold">이용약관</h1>
          <p className="mt-4 text-sm leading-6 text-neutral-600">
            본 약관은 CoffeeProd 예제 서비스의 이용 조건과 절차를 안내하기
            위한 샘플 문서입니다.
          </p>

          <section className="mt-8 space-y-4 text-sm leading-7 text-neutral-700">
            <h2 className="text-lg font-bold text-neutral-950">제1조 목적</h2>
            <p>
              CoffeeProd는 커피 상품 조회, 장바구니, 주문, 결제 테스트 기능을
              제공하는 학습용 커머스 서비스입니다.
            </p>

            <h2 className="text-lg font-bold text-neutral-950">제2조 회원 이용</h2>
            <p>
              회원은 정확한 정보를 입력해야 하며, 계정 정보 관리 책임은
              회원에게 있습니다. 타인의 계정을 무단으로 사용할 수 없습니다.
            </p>

            <h2 className="text-lg font-bold text-neutral-950">제3조 주문 및 결제</h2>
            <p>
              서비스의 결제 기능은 테스트 환경을 기준으로 제공되며, 실제 운영
              전에는 결제 승인, 취소, 환불 정책을 별도로 확정해야 합니다.
            </p>

            <h2 className="text-lg font-bold text-neutral-950">제4조 서비스 제한</h2>
            <p>
              부정 이용, 시스템 장애 유발, 허가되지 않은 관리자 기능 접근이
              확인되면 서비스 이용이 제한될 수 있습니다.
            </p>
          </section>
        </article>
      </div>
    </main>
  )
}
