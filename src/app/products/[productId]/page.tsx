import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Coffee, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"

const products = [
  {
    id: 1,
    name: "브라질 산토스",
    type: "원두",
    origin: "브라질",
    roastLevel: "미디엄 로스트",
    brewMethods: ["핸드드립", "에스프레소"],
    grindOptions: ["홀빈", "핸드드립용 분쇄", "에스프레소용 분쇄"],
    description:
      "고소한 견과류 향과 부드러운 산미가 있는 데일리 원두입니다. 부담 없이 매일 마시기 좋은 균형 잡힌 맛을 제공합니다.",
    price: 15000,
    imageSrc: "/images/products/brazil-santos.jpg",
  },
  {
    id: 2,
    name: "에티오피아 예가체프",
    type: "원두",
    origin: "에티오피아",
    roastLevel: "라이트 로스트",
    brewMethods: ["핸드드립"],
    grindOptions: ["홀빈", "핸드드립용 분쇄"],
    description:
      "꽃향과 과일향이 살아있는 산뜻한 싱글 오리진입니다. 향미를 천천히 즐기기 좋은 커피입니다.",
    price: 18000,
    imageSrc: "/images/products/ethiopia-yirgacheffe.jpg",
  },
  {
    id: 3,
    name: "콜롬비아 드립백 세트",
    type: "드립백",
    origin: "콜롬비아",
    roastLevel: "미디엄 다크 로스트",
    brewMethods: ["핸드드립"],
    grindOptions: ["드립백"],
    description:
      "도구 없이 간편하게 즐기는 7개입 드립백 세트입니다. 사무실이나 여행지에서도 쉽게 커피를 즐길 수 있습니다.",
    price: 12000,
    imageSrc: "/images/products/colombia-dripbag.jpg",
  },
]

const detailTabs = [
  { id: "detail", label: "상세정보" },
  { id: "reviews", label: "리뷰" },
  { id: "qna", label: "Q&A" },
  { id: "faq", label: "FAQ" },
  { id: "shipping", label: "배송 정보" },
]

type ProductDetailPageProps = {
  params: Promise<{
    productId: string
  }>
  searchParams: Promise<{
    tab?: string
  }>
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  // /products/1 에서 1에 해당하는 값이 productId로 들어옵니다.
  const { productId } = await params
  const { tab } = await searchParams

  // URL에서 받은 productId는 문자열이므로 숫자로 바꿔서 비교합니다.
  const product = products.find((item) => item.id === Number(productId))

  const selectedTab = detailTabs.some((item) => item.id === tab)
    ? tab
    : "detail"

  // 해당 상품이 없을 때 보여줄 간단한 예외 화면입니다.
  if (!product) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          <Button variant="outline" asChild>
            <Link href="/products">
              <ArrowLeft className="size-4" />
              상품 목록으로
            </Link>
          </Button>

          <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold">상품을 찾을 수 없습니다.</h1>
            <p className="mt-3 text-sm text-neutral-600">
              존재하지 않거나 판매가 종료된 상품입니다.
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Coffee className="size-5" />
            CoffeeProd
          </Link>

          <Button variant="outline" asChild>
            <Link href="/cart">
              <ShoppingCart className="size-4" />
              장바구니
            </Link>
          </Button>
        </header>

        <Button variant="ghost" asChild>
          <Link href="/products">
            <ArrowLeft className="size-4" />
            상품 목록으로
          </Link>
        </Button>

        <section className="mt-6 grid gap-8 md:grid-cols-[1fr_1fr]">
          {/* 상품 대표 이미지 영역입니다. */}
          <div className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
            <Image
              src={product.imageSrc}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          {/* 상품 정보 영역입니다. */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-neutral-500">
              {product.origin} · {product.roastLevel}
            </p>

            <h1 className="mt-3 text-3xl font-bold">{product.name}</h1>

            <p className="mt-4 leading-7 text-neutral-600">
              {product.description}
            </p>

            <div className="mt-6 grid gap-4 border-y border-neutral-200 py-5">
              <div>
                <h2 className="text-sm font-semibold">상품 종류</h2>
                <p className="mt-1 text-sm text-neutral-600">{product.type}</p>
              </div>

              <div>
                <h2 className="text-sm font-semibold">추천 추출 방식</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.brewMethods.map((method) => (
                    <span
                      key={method}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold">선택 가능한 분쇄 옵션</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.grindOptions.map((option) => (
                    <span
                      key={option}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600"
                    >
                      {option}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">판매가</p>
                <p className="text-2xl font-bold">
                  {product.price.toLocaleString()}원
                </p>
              </div>

              <Button>
                <ShoppingCart className="size-4" />
                장바구니 담기
              </Button>
            </div>
          </div>
        </section>
        {/* 상세 페이지 하단 탭 영역입니다. */}
    <section className="mt-10 rounded-lg border border-neutral-200 bg-white shadow-sm">
    <nav className="flex flex-wrap gap-2 border-b border-neutral-200 p-4">
        {detailTabs.map((item) => {
        const isActive = selectedTab === item.id

        return (
            <Button
            key={item.id}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            asChild
            >
            <Link href={`/products/${product.id}?tab=${item.id}`}>
                {item.label}
            </Link>
            </Button>
        )
        })}
    </nav>

    <div className="p-6">
        {selectedTab === "detail" && (
        <section>
            <h2 className="text-xl font-bold">상세정보</h2>
            <p className="mt-3 leading-7 text-neutral-600">
            {product.name}는 {product.origin} 원산지의 커피입니다.
            {product.roastLevel}로 로스팅되어 있으며, {product.brewMethods.join(", ")}
            방식으로 즐기기 좋습니다.
            </p>
        </section>
        )}

        {selectedTab === "reviews" && (
        <section>
            <h2 className="text-xl font-bold">리뷰</h2>
            <p className="mt-3 text-sm text-neutral-600">
            아직 등록된 리뷰가 없습니다. 나중에 백엔드 리뷰 API와 연결할 영역입니다.
            </p>
        </section>
        )}

        {selectedTab === "qna" && (
        <section>
            <h2 className="text-xl font-bold">Q&A</h2>
            <p className="mt-3 text-sm text-neutral-600">
            상품 문의를 보여주는 영역입니다. 로그인 후 문의 작성 기능을 붙일 수 있습니다.
            </p>
        </section>
        )}

        {selectedTab === "faq" && (
        <section>
            <h2 className="text-xl font-bold">FAQ</h2>
            <div className="mt-4 space-y-4 text-sm">
            <div>
                <h3 className="font-semibold">분쇄 옵션은 어디서 선택하나요?</h3>
                <p className="mt-1 text-neutral-600">
                장바구니에 담기 전 상품 상세 페이지에서 선택하게 만들 예정입니다.
                </p>
            </div>
            <div>
                <h3 className="font-semibold">원두 보관은 어떻게 하나요?</h3>
                <p className="mt-1 text-neutral-600">
                직사광선을 피하고 밀봉해서 서늘한 곳에 보관하는 것을 권장합니다.
                </p>
            </div>
            </div>
        </section>
        )}

        {selectedTab === "shipping" && (
        <section>
            <h2 className="text-xl font-bold">배송 정보</h2>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
            <li>배송비: 3,000원</li>
            <li>50,000원 이상 구매 시 무료배송</li>
            <li>평일 오전 주문 건은 영업일 기준 1-2일 내 출고</li>
            <li>제주 및 도서산간 지역은 추가 배송비가 발생할 수 있습니다.</li>
            </ul>
        </section>
        )}
    </div>
    </section>
      </div>
    </main>
  )
}