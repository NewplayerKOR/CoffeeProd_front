import Link from "next/link"
import { ArrowRight, Coffee, Mail, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"

// 백엔드 API를 연결하기 전까지 화면을 테스트하기 위한 임시 상품 데이터입니다.
// 나중에는 이 배열을 API 응답 데이터로 교체합니다.
const featuredProducts = [
  {
    id: 1,
    name: "브라질 산토스",
    description: "고소한 견과류 향과 부드러운 산미",
    price: "15,000원",
  },
  {
    id: 2,
    name: "에티오피아 예가체프",
    description: "꽃향과 과일향이 살아있는 원두",
    price: "18,000원",
  },
  {
    id: 3,
    name: "콜롬비아 수프리모",
    description: "균형 잡힌 바디감과 깔끔한 끝맛",
    price: "16,000원",
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      {/* 전체 페이지의 최대 너비를 제한해서 너무 넓게 퍼지지 않게 합니다. */}
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6">
        {/* header는 보통 로고, 메뉴, 로그인/장바구니 같은 상단 영역에 사용합니다. */}
        <header className="flex items-center justify-between border-b border-neutral-200 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Coffee className="size-5" />
            CoffeeProd
          </Link>

          {/* nav는 페이지 이동 링크를 묶을 때 사용하는 HTML 태그입니다. */}
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/products">상품</Link>
            </Button>

            {/* asChild를 쓰면 shadcn Button 스타일을 Link에 입힐 수 있습니다. */}
            <Button variant="outline" asChild>
              <Link href="/cart">
                <ShoppingCart className="size-4" />
                장바구니
              </Link>
            </Button>
          </nav>
        </header>

        {/* 첫 번째 section은 사용자가 처음 보는 메인 소개 영역입니다. */}
        <section className="grid gap-8 py-14 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-medium text-neutral-500">
              Coffee commerce project
            </p>

            <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
              집에서 즐기는 신선한 원두 쇼핑몰
            </h1>

            <p className="max-w-xl text-base leading-7 text-neutral-600">
              CoffeeProd는 원두 상품 조회, 장바구니, 주문, 결제 흐름을
              연습하기 위한 커피 커머스 프론트 프로젝트입니다.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/products">
                  상품 보러가기
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              <Button variant="outline" asChild>
                <Link href="/login">로그인</Link>
              </Button>
            </div>
          </div>

          {/* 오른쪽 추천 상품 카드입니다. 지금은 하드코딩이지만 나중에 API 데이터로 바꿀 수 있습니다. */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="mb-3 text-sm font-medium text-neutral-500">
              오늘의 추천
            </p>

            <h2 className="text-2xl font-semibold">브라질 산토스</h2>

            <p className="mt-3 text-sm leading-6 text-neutral-600">
              처음 연결 테스트용으로 쓰기 좋은 대표 상품 카드입니다.
              나중에는 이 영역을 백엔드 상품 API 데이터로 바꾸면 됩니다.
            </p>

            <p className="mt-6 text-xl font-bold">15,000원</p>
          </div>
        </section>

        {/* 추천 상품 목록입니다. map을 사용해서 배열 데이터를 카드 여러 개로 바꿉니다. */}
        <section className="grid gap-4 pb-14 md:grid-cols-3">
          {featuredProducts.map((product) => (
            <article
              key={product.id}
              className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold">{product.name}</h3>

              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {product.description}
              </p>

              <div className="mt-5 flex items-center justify-between">
                <span className="font-bold">{product.price}</span>

                <Button size="sm" variant="outline">
                  보기
                </Button>
              </div>
            </article>
          ))}
        </section>

        {/* footer는 회사 정보, 고객센터, 약관 링크 같은 하단 고정 정보를 담습니다. */}
        <footer className="border-t border-neutral-200 py-8 text-sm text-neutral-600">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <div className="flex items-center gap-2 font-semibold text-neutral-950">
                <Coffee className="size-4" />
                CoffeeProd
              </div>

              <p className="mt-3 leading-6">
                CoffeeProd는 커피 커머스 학습용 프로젝트입니다.
                실제 판매 서비스가 아닌 포트폴리오 목적의 예제 사이트입니다.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-neutral-950">고객센터</h2>

              <ul className="mt-3 space-y-2">
                <li className="flex items-center gap-2">
                  <Mail className="size-4" />
                  support@coffeeprod.example
                </li>
                <li>평일 10:00 - 17:00</li>
                <li>점심시간 12:00 - 13:00</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-neutral-950">안내</h2>

              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/terms" className="hover:text-neutral-950">
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-neutral-950">
                    개인정보처리방침
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="hover:text-neutral-950">
                    교환 및 환불 안내
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* 실제 서비스라면 사업자 정보와 통신판매업 신고 정보를 정확히 넣어야 합니다. */}
          <div className="mt-8 border-t border-neutral-200 pt-5 text-xs text-neutral-500">
            <p>상호명: CoffeeProd | 대표: 홍길동 | 사업자등록번호: 000-00-00000</p>
            <p className="mt-1">
              주소: 서울특별시 강남구 커피로 123 | 통신판매업 신고번호:
              제2026-서울강남-0000호
            </p>
            <p className="mt-4">© 2026 CoffeeProd. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </main>
  )
}