import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowRight } from "lucide-react"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { getProducts, type ProductListItem } from "@/lib/api/catalog"
import { getRoastLevelLabel } from "@/lib/coffee-display"

import { HomeFeatureCards } from "./home-feature-cards"
import { HomeSlider, type HomeSlide } from "./home-slider"
import { HomeTasteFinder } from "./home-taste-finder"
import { PortfolioNoticeDialog } from "./portfolio-notice-dialog"
import { ProductImage } from "./products/product-image"

export default async function Home() {
  const featuredProducts = await loadFeaturedProducts()
  const slides = buildHomeSlides(featuredProducts)

  return (
    <main className="home-page">
      <PortfolioNoticeDialog />
      <SiteHeader />

      <section className="home-editorial-hero" aria-labelledby="home-title">
        <Image
          src="/images/coffeeprod-hero-light.webp"
          alt="커피 패키지와 핸드드립 도구가 놓인 밝은 로스터리"
          fill
          fetchPriority="high"
          sizes="100vw"
          className="home-hero-image home-hero-image-light"
        />
        <Image
          src="/images/coffeeprod-hero-dark.webp"
          alt="커피 패키지와 핸드드립 도구가 놓인 어두운 로스터리"
          fill
          fetchPriority="high"
          sizes="100vw"
          className="home-hero-image home-hero-image-dark"
        />

        <div className="home-hero-content">
          <p className="editorial-kicker">Specialty coffee, curated for you</p>
          <h1 id="home-title">CoffeeProd</h1>
          <p className="home-hero-copy">
            당신의 취향이 머무는 한 잔을 찾습니다.
          </p>
          <div className="home-hero-actions">
            <Button size="lg" asChild>
              <Link href="#taste-finder">
                취향으로 커피 찾기
                <ArrowDown data-icon="inline-end" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/products">
                원두 둘러보기
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div id="taste-finder" className="home-content-band">
        <HomeTasteFinder initialProduct={featuredProducts[0] ?? null} />
      </div>

      <section className="home-journal-section">
        <div className="home-section-heading">
          <div>
            <p className="editorial-kicker">Coffee Journal</p>
            <h2>한 잔을 고르는 새로운 기준</h2>
          </div>
          <p>원두 이야기와 CoffeeProd의 새로운 소식을 만나보세요.</p>
        </div>
        <HomeSlider slides={slides} />
      </section>

      <section className="home-products-section" aria-labelledby="home-products-title">
        <div className="home-section-heading home-products-heading">
          <div>
            <p className="editorial-kicker">Today&apos;s coffee</p>
            <h2 id="home-products-title">오늘의 커피</h2>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/products">
              전체 상품 보기
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="editorial-product-grid">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="editorial-product"
              >
                <div className="editorial-product-image">
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.name}
                    sizes="(max-width: 700px) 50vw, 25vw"
                  />
                </div>
                <div className="editorial-product-copy">
                  <p>
                    {product.categoryName} · {getRoastLevelLabel(product.roastLevel)}
                  </p>
                  <h3>{product.name}</h3>
                  <span>
                    {product.coffeeProfileName ?? product.sku} · {product.weightGrams}g
                  </span>
                  <strong>{product.price.toLocaleString()}원</strong>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="home-empty-state">
            상품 미리보기를 불러오지 못했습니다. 상품 목록에서 다시 확인해
            주세요.
          </div>
        )}
      </section>

      <HomeFeatureCards />
      <SiteFooter />
    </main>
  )
}

function buildHomeSlides(products: ProductListItem[]): HomeSlide[] {
  const productSlides = products.slice(0, 3).map((product) => ({
    id: `product-${product.id}`,
    eyebrow: product.categoryName,
    title: product.name,
    description: `${product.coffeeProfileName ?? product.categoryName}의 향미와 로스팅 정보를 확인하고 오늘의 원두로 만나보세요.`,
    href: `/products/${product.id}`,
    imageUrl: product.imageUrl,
    ctaLabel: "상품 보기",
  }))

  return [
    ...productSlides,
    {
      id: "event-taste",
      eyebrow: "Taste Finder",
      title: "취향을 기록하면 선택이 쉬워집니다",
      description:
        "산미, 바디, 단맛과 향의 선호도를 바탕으로 현재 판매 가능한 커피를 추천합니다.",
      href: "/recommendations",
      imageUrl: null,
      ctaLabel: "취향 추천 시작",
    },
    {
      id: "event-account",
      eyebrow: "Membership",
      title: "좋아하는 커피를 다음 한 잔으로 이어가세요",
      description:
        "회원 취향을 저장하고 배송지, 장바구니와 주문 내역을 한 흐름으로 관리할 수 있습니다.",
      href: "/login",
      imageUrl: null,
      ctaLabel: "로그인",
    },
  ]
}

async function loadFeaturedProducts(): Promise<ProductListItem[]> {
  try {
    const products = await getProducts(
      {
        page: 0,
        size: 4,
        sort: "createdAt,desc",
      },
      {
        next: { revalidate: 60, tags: ["public-products"] },
      }
    )

    return products.content
  } catch {
    return []
  }
}
