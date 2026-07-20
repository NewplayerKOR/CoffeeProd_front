import Link from "next/link"
import {
  ArrowLeft,
  PackageCheck,
  PackageX,
  Truck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import {
  getProduct,
  type ProductDetail,
  type ProductStatus,
  type RoastLevel,
} from "@/lib/api/catalog"
import type { CoffeeProfileSummary } from "@/lib/api/coffee"
import { ApiError } from "@/lib/api/types"
import { getBeanTypeLabel } from "@/lib/coffee-display"
import {
  DELIVERY_BASE_FEE,
  DELIVERY_FREE_THRESHOLD,
} from "@/lib/order-pricing"
import { cn } from "@/lib/utils"

import { ProductImage } from "../product-image"
import { ProductQnas, ProductReviews } from "./product-community"
import { ProductPurchaseForm } from "./product-purchase-form"

const detailTabs = [
  { id: "detail", label: "상세정보" },
  { id: "reviews", label: "리뷰" },
  { id: "qna", label: "Q&A" },
  { id: "faq", label: "FAQ" },
  { id: "shipping", label: "배송 정보" },
] as const

type DetailTabId = (typeof detailTabs)[number]["id"]

type ProductDetailPageProps = {
  params: Promise<{
    productId: string
  }>
  searchParams: Promise<{
    tab?: string | string[]
  }>
}

type ProductLoadState =
  | {
      product: ProductDetail
      errorMessage: null
      notFound: false
    }
  | {
      product: null
      errorMessage: string
      notFound: boolean
    }

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  const { productId } = await params
  const { tab } = await searchParams
  const selectedTab = parseDetailTab(firstParam(tab))
  const productState = await loadProduct(productId)

  if (!productState.product) {
    return (
      <ProductDetailShell>
        <Button variant="outline" asChild>
          <Link href="/products">
            <ArrowLeft data-icon="inline-start" />
            상품 목록으로
          </Link>
        </Button>

        <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
            <PackageX className="size-6 text-neutral-500" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">
            {productState.notFound
              ? "상품을 찾을 수 없습니다."
              : "상품 정보를 불러오지 못했습니다."}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
            {productState.errorMessage}
          </p>
        </section>
      </ProductDetailShell>
    )
  }

  const product = productState.product
  const isPurchasable = product.status === "ON_SALE" && product.stockQuantity > 0

  return (
    <ProductDetailShell>
      <Button variant="ghost" asChild>
        <Link href="/products">
          <ArrowLeft data-icon="inline-start" />
          상품 목록으로
        </Link>
      </Button>

      <section className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
          <div className="aspect-square">
            <ProductImage src={product.imageUrl} alt={product.name} />
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <ProductStatusPill status={product.status} />
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
              {product.categoryName}
            </span>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
              {getRoastLevelLabel(product.roastLevel)}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold">{product.name}</h1>

          {product.coffeeProfile && (
            <Link
              href={`/coffee-profiles/${product.coffeeProfile.id}`}
              className="mt-2 inline-flex text-sm font-medium text-neutral-500 hover:text-neutral-950"
            >
              {product.coffeeProfile.profileName} 프로필 보기
            </Link>
          )}

          <p className="mt-4 leading-7 text-neutral-600">
            {product.description}
          </p>

          <div className="mt-6 grid gap-4 border-y border-neutral-200 py-5">
            <ProductInfoRow label="상품 번호" value={String(product.id)} />
            <ProductInfoRow label="SKU" value={product.sku} />
            <ProductInfoRow label="중량" value={`${product.weightGrams}g`} />
            <ProductInfoRow label="카테고리" value={product.categoryName} />
            <ProductInfoRow
              label="로스팅"
              value={getRoastLevelLabel(product.roastLevel)}
            />
            <ProductInfoRow
              label="재고"
              value={
                product.stockQuantity > 0
                  ? `${product.stockQuantity.toLocaleString()}개`
                  : "품절"
              }
            />
          </div>

          <div className="mt-6">
            <p className="text-sm text-neutral-500">판매가</p>
            <p className="mt-1 text-3xl font-bold">
              {product.price.toLocaleString()}원
            </p>
          </div>

          <ProductPurchaseForm
            productId={product.id}
            status={product.status}
            stockQuantity={product.stockQuantity}
          />

          {!isPurchasable && (
            <p className="mt-3 text-sm text-neutral-500">
              현재 구매할 수 없는 상품입니다.
            </p>
          )}
        </div>
      </section>

      <section className="mt-10 rounded-lg border border-neutral-200 bg-white shadow-sm">
        <nav className="flex flex-wrap gap-2 border-b border-neutral-200 p-4">
          {detailTabs.map((item) => {
            const isActive = selectedTab === item.id
            const href =
              item.id === "detail"
                ? `/products/${product.id}`
                : `/products/${product.id}?tab=${item.id}`

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                asChild
              >
                <Link href={href}>{item.label}</Link>
              </Button>
            )
          })}
        </nav>

        <div className="p-6">
          <ProductDetailTab product={product} selectedTab={selectedTab} />
        </div>
      </section>
    </ProductDetailShell>
  )
}

function ProductDetailShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[1320px] px-6 py-12">
        {children}
      </div>
      <SiteFooter />
    </main>
  )
}

function ProductInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-medium text-neutral-500">{label}</span>
      <span className="text-right font-semibold text-neutral-900">{value}</span>
    </div>
  )
}

function ProductStatusPill({ status }: { status: ProductStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        status === "ON_SALE" && "bg-neutral-950 text-white",
        status === "SOLD_OUT" && "bg-neutral-100 text-neutral-500",
        status === "HIDDEN" && "bg-neutral-200 text-neutral-600"
      )}
    >
      {getStatusLabel(status)}
    </span>
  )
}

function ProductDetailTab({
  product,
  selectedTab,
}: {
  product: ProductDetail
  selectedTab: DetailTabId
}) {
  if (selectedTab === "reviews") {
    return <ProductReviews productId={product.id} />
  }

  if (selectedTab === "qna") {
    return <ProductQnas productId={product.id} />
  }

  if (selectedTab === "faq") {
    return (
      <section>
        <h2 className="text-xl font-bold">FAQ</h2>
        <div className="mt-5 flex flex-col gap-5 text-sm">
          <div>
            <h3 className="font-semibold">분쇄 옵션은 어디에서 선택하나요?</h3>
            <p className="mt-2 leading-6 text-neutral-600">
              상품 상세의 구매 영역에서 홀빈, 에스프레소, 드립, 프렌치프레스
              중 하나를 선택할 수 있습니다.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">원두 보관은 어떻게 하나요?</h3>
            <p className="mt-2 leading-6 text-neutral-600">
              직사광선을 피하고 밀봉해 서늘한 곳에 보관하는 것을 권장합니다.
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (selectedTab === "shipping") {
    return (
      <section>
        <div className="flex items-center gap-2">
          <Truck className="size-5 text-neutral-500" />
          <h2 className="text-xl font-bold">배송 정보</h2>
        </div>
        <ul className="mt-5 flex flex-col gap-2 text-sm leading-6 text-neutral-600">
          <li>
            배송비는 {DELIVERY_BASE_FEE.toLocaleString()}원이며 상품 금액{" "}
            {DELIVERY_FREE_THRESHOLD.toLocaleString()}원 이상 구매 시 무료
            배송입니다.
          </li>
          <li>평일 오전 주문 건은 영업일 기준 1-2일 안에 출고됩니다.</li>
          <li>제주 및 도서산간 지역은 추가 배송비가 발생할 수 있습니다.</li>
        </ul>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center gap-2">
        <PackageCheck className="size-5 text-neutral-500" />
        <h2 className="text-xl font-bold">상세정보</h2>
      </div>
      <p className="mt-4 leading-7 text-neutral-600">{product.description}</p>
      <dl className="mt-6 grid gap-4 rounded-lg border border-neutral-200 p-5 text-sm md:grid-cols-2">
        <ProductSpec label="상품명" value={product.name} />
        <ProductSpec label="SKU" value={product.sku} />
        <ProductSpec label="중량" value={`${product.weightGrams}g`} />
        <ProductSpec label="카테고리" value={product.categoryName} />
        <ProductSpec label="로스팅" value={getRoastLevelLabel(product.roastLevel)} />
        <ProductSpec label="상태" value={getStatusLabel(product.status)} />
      </dl>
      {product.coffeeProfile && (
        <ProductCoffeeProfile profile={product.coffeeProfile} />
      )}
    </section>
  )
}

function ProductCoffeeProfile({ profile }: { profile: CoffeeProfileSummary }) {
  return (
    <section className="mt-8 border-t border-neutral-200 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-500">Coffee Profile</p>
          <h3 className="mt-1 text-lg font-bold">{profile.profileName}</h3>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/coffee-profiles/${profile.id}`}>전체 프로필 보기</Link>
        </Button>
      </div>
      <p className="mt-4 text-sm leading-6 text-neutral-600">
        {profile.summary || `${getBeanTypeLabel(profile.beanType)} 커피 프로필입니다.`}
      </p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProductSpec label="산미" value={`${profile.acidity} / 5`} />
        <ProductSpec label="바디" value={`${profile.body} / 5`} />
        <ProductSpec label="단맛" value={`${profile.sweetness} / 5`} />
        <ProductSpec label="향" value={`${profile.aroma} / 5`} />
      </dl>
      {profile.flavorNotes.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {profile.flavorNotes.map((note) => (
            <span
              key={note.flavorNoteId}
              className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600"
            >
              {note.name} {note.intensity}/5
            </span>
          ))}
        </div>
      )}
    </section>
  )
}

function ProductSpec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-neutral-500">{label}</dt>
      <dd className="mt-1 font-semibold text-neutral-900">{value}</dd>
    </div>
  )
}

async function loadProduct(productId: string): Promise<ProductLoadState> {
  try {
    return {
      product: await getProduct(productId),
      errorMessage: null,
      notFound: false,
    }
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.httpStatus === 404 || error.bodyStatus === 404)
    ) {
      return {
        product: null,
        errorMessage: "존재하지 않거나 판매가 종료된 상품입니다.",
        notFound: true,
      }
    }

    return {
      product: null,
      errorMessage:
        error instanceof ApiError
          ? error.message
          : "일시적인 오류가 발생했습니다.",
      notFound: false,
    }
  }
}

function parseDetailTab(value: string | undefined): DetailTabId {
  return detailTabs.some((item) => item.id === value)
    ? (value as DetailTabId)
    : "detail"
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getRoastLevelLabel(roastLevel: RoastLevel) {
  if (roastLevel === "LIGHT") {
    return "라이트"
  }

  if (roastLevel === "MEDIUM") {
    return "미디엄"
  }

  return "다크"
}

function getStatusLabel(status: ProductStatus) {
  if (status === "ON_SALE") {
    return "판매중"
  }

  if (status === "SOLD_OUT") {
    return "품절"
  }

  return "숨김"
}
