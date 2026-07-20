import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export default function PrivacyPage() {
  return (
    <main className="legal-page flex min-h-screen flex-col bg-neutral-50 text-neutral-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[860px] flex-1 px-6 py-14">
        <article>
          <p className="editorial-kicker">Privacy</p>
          <h1 className="mt-3 text-4xl font-bold">개인정보처리방침</h1>
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
      <SiteFooter />
    </main>
  )
}
