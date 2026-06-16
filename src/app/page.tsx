import Link from "next/link"
import {
  ArrowRight,
  Coffee,
  Mail,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  getProducts,
  type ProductListItem,
} from "@/lib/api/catalog"

import { CartNavButton } from "./cart/cart-nav-button"
import { HomeAuthActions } from "./home-auth-actions"
import { HomeFeatureCards } from "./home-feature-cards"
import { HomeSlider, type HomeSlide } from "./home-slider"
import { ProductImage } from "./products/product-image"

export default async function Home() {
  const featuredProducts = await loadFeaturedProducts()
  const slides = buildHomeSlides(featuredProducts)

  return (
    <main className="flex flex-1 flex-col bg-neutral-50 text-neutral-950">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
        <header className="flex flex-col gap-4 border-b border-neutral-200 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Coffee className="size-5" />
            CoffeeProd
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/about">소개</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/products">상품</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/orders">주문</Link>
            </Button>
            <CartNavButton />
            <ThemeToggle />
            <HomeAuthActions />
          </nav>
        </header>

        <section className="py-8">
          <div className="home-hero relative isolate overflow-hidden rounded-lg border border-neutral-200 bg-neutral-950 px-6 py-12 shadow-sm md:px-8 md:py-16">
            <div
              className="home-hero-media absolute inset-0 -z-20 bg-cover bg-center"
              style={{ backgroundImage: "url('/images/hero-coffee-bg.svg')" }}
            />
            <div className="home-hero-overlay absolute inset-0 -z-10 bg-white/72" />
            <div className="flex max-w-3xl flex-col gap-5">
              <p className="home-hero-kicker text-sm font-medium text-neutral-600">
                Coffee commerce
              </p>
              <h1 className="home-hero-title text-4xl font-bold leading-tight md:text-5xl">
                원두 탐색부터 주문, 결제, 배송 관리까지 한 번에
              </h1>
              <p className="home-hero-copy max-w-2xl text-base leading-7 text-neutral-700">
                CoffeeProd는 상품 조회, 장바구니, 배송지, 주문, Fake 결제,
                관리자 운영 화면까지 연결된 커피 커머스 프론트엔드입니다.
              </p>

              <Button className="w-fit" asChild>
                <Link href="/products">
                  상품 보러가기
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="pb-12">
          <HomeSlider slides={slides} />
        </section>

        <HomeFeatureCards />

        <section className="pb-12">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                Products
              </p>
              <h2 className="mt-2 text-2xl font-bold">최근 상품</h2>
            </div>
            <Button variant="outline" asChild>
              <Link href="/products">
                전체 보기
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
                >
                  <div className="aspect-square bg-neutral-100 md:aspect-[4/3]">
                    <ProductImage src={product.imageUrl} alt={product.name} />
                  </div>
                  <div className="flex min-h-32 flex-col p-3 md:min-h-44 md:p-5">
                    <p className="truncate text-[11px] font-medium text-neutral-500 md:text-sm">
                      {product.categoryName}
                    </p>
                    <h3 className="mobile-line-clamp-2 mt-1 text-sm font-bold leading-5 md:mt-2 md:text-base">
                      {product.name}
                    </h3>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-4 md:gap-3 md:pt-5">
                      <span className="text-sm font-bold md:text-base">
                        {product.price.toLocaleString()}원
                      </span>
                      <span className="hidden h-8 items-center rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-700 sm:inline-flex">
                        상세
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
              상품 미리보기를 불러오지 못했습니다. 상품 목록 화면에서 다시
              확인해 주세요.
            </div>
          )}
        </section>

        <footer className="mt-auto border-t border-neutral-200 py-8 text-sm text-neutral-600">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <div className="flex items-center gap-2 font-semibold text-neutral-950">
                <Coffee className="size-4" />
                CoffeeProd
              </div>
              <p className="mt-3 leading-6">
                CoffeeProd는 커피 커머스 학습을 위한 프론트엔드
                프로젝트입니다. 실제 판매 서비스가 아닌 포트폴리오 목적의 예제
                사이트입니다.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-neutral-950">고객센터</h2>
              <ul className="mt-3 flex flex-col gap-2">
                <li className="flex items-center gap-2">
                  <Mail className="size-4" />
                  support@coffeeprod.example
                </li>
                <li>평일 10:00 - 17:00</li>
                <li>점심시간 12:00 - 13:00</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-neutral-950">바로가기</h2>
              <ul className="mt-3 flex flex-col gap-2">
                <li>
                  <Link href="/about" className="hover:text-neutral-950">
                    소개
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-neutral-950">
                    상품 목록
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-neutral-950">
                    장바구니
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="hover:text-neutral-950">
                    주문 내역
                  </Link>
                </li>
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
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-neutral-200 pt-5 text-xs text-neutral-500">
            <p>상호명: CoffeeProd | 대표: 홍길동 | 사업자등록번호: 000-00-00000</p>
            <p className="mt-1">
              주소: 서울특별시 강남구 커피로 123 | 통신판매업신고번호:
              제2026-서울강남-0000호
            </p>
            <p className="mt-4">© 2026 CoffeeProd. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </main>
  )
}

function buildHomeSlides(products: ProductListItem[]): HomeSlide[] {
  const productSlides = products.map((product) => ({
    id: `product-${product.id}`,
    title: product.name,
    description: `${product.categoryName} 원두를 지금 확인하고 장바구니에 담아보세요.`,
    href: `/products/${product.id}`,
    imageUrl: product.imageUrl,
    ctaLabel: "상품 상세",
  }))

  return [
    ...productSlides,
    {
      id: "event-checkout",
      title: "첫 주문 플로우 오픈",
      description:
        "배송지 등록, 장바구니, 주문서 작성, Fake 결제 승인까지 이어지는 구매 흐름을 사용할 수 있습니다.",
      href: "/products",
      imageUrl: null,
      ctaLabel: "시작하기",
    },
    {
      id: "event-account",
      title: "회원 전용 관리 메뉴",
      description:
        "로그인 후 마이페이지, 배송지 관리, 주문 내역, 장바구니 상태를 한 화면에서 이어갈 수 있습니다.",
      href: "/login",
      imageUrl: null,
      ctaLabel: "로그인",
    },
  ]
}

async function loadFeaturedProducts(): Promise<ProductListItem[]> {
  try {
    const products = await getProducts({
      page: 0,
      size: 3,
      sort: "createdAt,desc",
    })

    return products.content
  } catch {
    return []
  }
}
