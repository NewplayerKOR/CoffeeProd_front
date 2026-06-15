import Link from "next/link"
import { Coffee, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"

const categories = [
  { id: "all", name: "전체" },
  { id: "single", name: "싱글 오리진" },
  { id: "blend", name: "블렌드" },
  { id: "decaf", name: "디카페인" },
  { id: "dripbag", name: "드립백" },
]

// 백엔드 API 연결 전까지 화면 확인용으로 사용하는 임시 상품 데이터입니다.
const products = [
  {
    id: 1,
    name: "브라질 산토스",
    category: "single",
    description: "고소한 견과류 향과 부드러운 산미",
    price: 15000,
  },
  {
    id: 2,
    name: "에티오피아 예가체프",
    category: "single",
    description: "꽃향과 과일향이 살아있는 원두",
    price: 18000,
  },
  {
    id: 3,
    name: "하우스 블렌드",
    category: "blend",
    description: "매일 마시기 좋은 균형 잡힌 블렌드",
    price: 16000,
  },
  {
    id: 4,
    name: "디카페인 콜롬비아",
    category: "decaf",
    description: "카페인 부담 없이 즐기는 부드러운 커피",
    price: 17000,
  },
  {
    id: 5,
    name: "모닝 드립백 세트",
    category: "dripbag",
    description: "간편하게 즐기는 7개입 드립백 세트",
    price: 12000,
  },
]

type ProductsPageProps = {
  searchParams: Promise<{
    category?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Next.js App Router에서는 URL의 ?category=single 같은 값을 searchParams로 받을 수 있습니다.
  const { category } = await searchParams

  // category가 없으면 전체 상품을 보여줍니다.
  const selectedCategory = category ?? "all"

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => product.category === selectedCategory)

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Coffee className="size-5" />
            CoffeeProd
          </Link>

          <Button variant="outline" asChild>
            <Link href="/cart">장바구니</Link>
          </Button>
        </header>

        <section className="mb-8">
          <p className="text-sm font-medium text-neutral-500">Products</p>
          <h1 className="mt-2 text-3xl font-bold">상품 목록</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            카테고리를 선택해서 원하는 커피 상품만 확인할 수 있습니다.
            지금은 임시 데이터를 사용하고, 나중에 백엔드 상품 API와 연결합니다.
          </p>
        </section>

        {/* 카테고리 필터 영역입니다. Link를 사용해서 URL을 바꾸는 방식입니다. */}
        <section className="mb-8 flex flex-wrap items-center gap-2">
          <div className="mr-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
            <SlidersHorizontal className="size-4" />
            카테고리
          </div>

          {categories.map((item) => {
            const isActive = item.id === selectedCategory
            const href =
              item.id === "all" ? "/products" : `/products?category=${item.id}`

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={href}>{item.name}</Link>
              </Button>
            )
          })}
        </section>

        {/* 상품 목록 영역입니다. */}
        <section className="grid gap-4 md:grid-cols-3">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <p className="mb-2 text-xs font-medium text-neutral-500">
                {categories.find((item) => item.id === product.category)?.name}
              </p>

              <h2 className="text-lg font-semibold">{product.name}</h2>

              <p className="mt-2 min-h-12 text-sm leading-6 text-neutral-600">
                {product.description}
              </p>

              <div className="mt-5 flex items-center justify-between">
                <span className="font-bold">
                  {product.price.toLocaleString()}원
                </span>

                <Button size="sm" variant="outline" asChild>
                  <Link href={`/products/${product.id}`}>상세보기</Link>
                </Button>
              </div>
            </article>
          ))}
        </section>

        {filteredProducts.length === 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600">
            선택한 카테고리에 상품이 없습니다.
          </div>
        )}
      </div>
    </main>
  )
}