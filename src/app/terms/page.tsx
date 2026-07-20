import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export default function TermsPage() {
  return (
    <main className="legal-page flex min-h-screen flex-col bg-neutral-50 text-neutral-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[860px] flex-1 px-6 py-14">
        <article>
          <p className="editorial-kicker">Terms</p>
          <h1 className="mt-3 text-4xl font-bold">이용약관</h1>
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
      <SiteFooter />
    </main>
  )
}
