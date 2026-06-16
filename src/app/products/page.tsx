import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Coffee,
  Search,
  SlidersHorizontal,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  getCategories,
  getProducts,
  type Category,
  type ProductListItem,
  type ProductListParams,
  type RoastLevel,
} from "@/lib/api/catalog"
import type { PageResponse } from "@/lib/api/types"
import { cn } from "@/lib/utils"

import { CartNavButton } from "../cart/cart-nav-button"
import { ProductImage } from "./product-image"

const roastLevelOptions = [
  { value: "LIGHT", label: "라이트" },
  { value: "MEDIUM", label: "미디엄" },
  { value: "DARK", label: "다크" },
] satisfies Array<{ value: RoastLevel; label: string }>

const sortOptions = [
  { value: "createdAt,desc", label: "최신순" },
  { value: "price,asc", label: "가격 낮은순" },
  { value: "price,desc", label: "가격 높은순" },
]

const defaultPage = 0
const defaultSize = 12
const defaultSort = "createdAt,desc"

type ProductsPageSearchParams = {
  categoryId?: string | string[]
  roastLevel?: string | string[]
  keyword?: string | string[]
  page?: string | string[]
  size?: string | string[]
  sort?: string | string[]
}

type ProductsPageProps = {
  searchParams: Promise<ProductsPageSearchParams>
}

type ProductListState = {
  categories: Category[]
  products: PageResponse<ProductListItem> | null
  categoriesError: string | null
  productsError: string | null
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const rawSearchParams = await searchParams
  const filters = parseProductFilters(rawSearchParams)
  const listState = await loadProductList(filters.apiParams)
  const products = listState.products?.content ?? []

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Coffee className="size-5" />
            CoffeeProd
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CartNavButton />
          </div>
        </header>

        <section className="mb-8">
          <p className="text-sm font-medium text-neutral-500">Products</p>
          <h1 className="mt-2 text-3xl font-bold">상품 목록</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            백엔드 상품 API 기준으로 카테고리, 로스팅 강도, 검색어, 정렬,
            페이지네이션을 URL에 유지합니다.
          </p>
        </section>

        <section className="mb-8 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <form action="/products" className="flex flex-col gap-3 md:flex-row">
            {filters.categoryId !== undefined && (
              <input
                type="hidden"
                name="categoryId"
                value={String(filters.categoryId)}
              />
            )}
            {filters.roastLevel && (
              <input
                type="hidden"
                name="roastLevel"
                value={filters.roastLevel}
              />
            )}
            <input type="hidden" name="sort" value={filters.sort} />
            <input type="hidden" name="size" value={String(filters.size)} />

            <label className="sr-only" htmlFor="keyword">
              상품명 검색
            </label>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3">
              <Search className="size-4 text-neutral-400" />
              <input
                id="keyword"
                name="keyword"
                type="search"
                defaultValue={filters.keyword}
                placeholder="상품명 검색"
                className="h-10 w-full border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"
              />
            </div>

            <Button type="submit">검색</Button>
            {(filters.keyword ||
              filters.categoryId !== undefined ||
              filters.roastLevel) && (
              <Button type="button" variant="outline" asChild>
                <Link href={buildProductsHref({ sort: filters.sort })}>
                  초기화
                </Link>
              </Button>
            )}
          </form>
        </section>

        <section className="mb-6 flex flex-col gap-4">
          <FilterGroup label="카테고리">
            <FilterLink
              href={buildProductsHref(filters.urlParams, {
                categoryId: undefined,
                page: undefined,
              })}
              active={filters.categoryId === undefined}
            >
              전체
            </FilterLink>
            {listState.categories.map((category) => (
              <FilterLink
                key={category.id}
                href={buildProductsHref(filters.urlParams, {
                  categoryId: String(category.id),
                  page: undefined,
                })}
                active={filters.categoryId === category.id}
              >
                {category.name}
              </FilterLink>
            ))}
          </FilterGroup>

          {listState.categoriesError && (
            <p className="text-sm text-red-600">{listState.categoriesError}</p>
          )}

          <FilterGroup label="로스팅">
            <FilterLink
              href={buildProductsHref(filters.urlParams, {
                roastLevel: undefined,
                page: undefined,
              })}
              active={!filters.roastLevel}
            >
              전체
            </FilterLink>
            {roastLevelOptions.map((option) => (
              <FilterLink
                key={option.value}
                href={buildProductsHref(filters.urlParams, {
                  roastLevel: option.value,
                  page: undefined,
                })}
                active={filters.roastLevel === option.value}
              >
                {option.label}
              </FilterLink>
            ))}
          </FilterGroup>

          <FilterGroup label="정렬">
            {sortOptions.map((option) => (
              <FilterLink
                key={option.value}
                href={buildProductsHref(filters.urlParams, {
                  sort: option.value,
                  page: undefined,
                })}
                active={filters.sort === option.value}
              >
                {option.label}
              </FilterLink>
            ))}
          </FilterGroup>
        </section>

        <section className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-600">
            총{" "}
            <span className="font-semibold text-neutral-950">
              {listState.products?.totalElements ?? 0}
            </span>
            개 상품
          </p>

          <p className="text-sm text-neutral-500">
            {filters.page + 1} / {Math.max(listState.products?.totalPages ?? 1, 1)}
            페이지
          </p>
        </section>

        {listState.productsError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {listState.productsError}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition-colors hover:border-neutral-950"
            >
              <div className="aspect-square bg-neutral-100 md:aspect-[4/3]">
                <ProductImage src={product.imageUrl} alt={product.name} />
              </div>

              <div className="flex min-h-36 flex-col p-3 md:min-h-52 md:p-5">
                <div className="mb-2 flex min-w-0 flex-wrap items-center gap-1 md:mb-3 md:gap-2">
                  <span className="max-w-full truncate rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 md:px-2.5 md:py-1 md:text-xs">
                    {product.categoryName}
                  </span>
                  <span className="hidden rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 sm:inline-flex">
                    {getRoastLevelLabel(product.roastLevel)}
                  </span>
                </div>

                <h2 className="mobile-line-clamp-2 text-sm font-semibold leading-5 md:text-lg">
                  {product.name}
                </h2>

                <div className="mt-auto flex items-center justify-between gap-2 pt-4 md:gap-3 md:pt-5">
                  <span className="text-sm font-bold md:text-base">
                    {product.price.toLocaleString()}원
                  </span>
                  <span className="hidden text-sm font-medium text-neutral-500 group-hover:text-neutral-950 sm:inline">
                    상세보기
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {products.length === 0 && !listState.productsError && (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600">
            조건에 맞는 상품이 없습니다.
          </div>
        )}

        {listState.products && listState.products.totalPages > 1 && (
          <nav
            className="mt-8 flex items-center justify-center gap-2"
            aria-label="상품 목록 페이지"
          >
            <Button
              variant="outline"
              disabled={listState.products.first}
              asChild={!listState.products.first}
            >
              {listState.products.first ? (
                <span>
                  <ArrowLeft data-icon="inline-start" />
                  이전
                </span>
              ) : (
                <Link
                  href={buildProductsHref(filters.urlParams, {
                    page: String(Math.max(filters.page - 1, 0)),
                  })}
                >
                  <ArrowLeft data-icon="inline-start" />
                  이전
                </Link>
              )}
            </Button>

            {getPageNumbers(listState.products.totalPages, filters.page).map(
              (pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === filters.page ? "default" : "outline"}
                  size="sm"
                  asChild
                >
                  <Link
                    href={buildProductsHref(filters.urlParams, {
                      page: String(pageNumber),
                    })}
                  >
                    {pageNumber + 1}
                  </Link>
                </Button>
              )
            )}

            <Button
              variant="outline"
              disabled={listState.products.last}
              asChild={!listState.products.last}
            >
              {listState.products.last ? (
                <span>
                  다음
                  <ArrowRight data-icon="inline-end" />
                </span>
              ) : (
                <Link
                  href={buildProductsHref(filters.urlParams, {
                    page: String(filters.page + 1),
                  })}
                >
                  다음
                  <ArrowRight data-icon="inline-end" />
                </Link>
              )}
            </Button>
          </nav>
        )}
      </div>
    </main>
  )
}

function FilterGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="mr-2 flex items-center gap-2 text-sm font-medium text-neutral-600">
        <SlidersHorizontal className="size-4" />
        {label}
      </div>
      {children}
    </div>
  )
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      className={cn(active && "pointer-events-none")}
      asChild
    >
      <Link href={href}>{children}</Link>
    </Button>
  )
}

async function loadProductList(
  params: ProductListParams
): Promise<ProductListState> {
  const [categoriesResult, productsResult] = await Promise.allSettled([
    getCategories(),
    getProducts(params),
  ])

  return {
    categories:
      categoriesResult.status === "fulfilled" ? categoriesResult.value : [],
    products: productsResult.status === "fulfilled" ? productsResult.value : null,
    categoriesError:
      categoriesResult.status === "rejected"
        ? "카테고리 목록을 불러오지 못했습니다."
        : null,
    productsError:
      productsResult.status === "rejected"
        ? "상품 목록을 불러오지 못했습니다. 백엔드 서버 상태를 확인해 주세요."
        : null,
  }
}

function parseProductFilters(searchParams: ProductsPageSearchParams) {
  const categoryId = parsePositiveInteger(firstParam(searchParams.categoryId))
  const roastLevel = parseRoastLevel(firstParam(searchParams.roastLevel))
  const keyword = (firstParam(searchParams.keyword) ?? "").trim()
  const page = parseNonNegativeInteger(firstParam(searchParams.page)) ?? defaultPage
  const size = parsePositiveInteger(firstParam(searchParams.size)) ?? defaultSize
  const sort = parseSort(firstParam(searchParams.sort))

  const apiParams: ProductListParams = {
    page,
    size,
    sort,
  }

  if (categoryId !== undefined) {
    apiParams.categoryId = categoryId
  }

  if (roastLevel) {
    apiParams.roastLevel = roastLevel
  }

  if (keyword) {
    apiParams.keyword = keyword
  }

  const urlParams: Record<string, string | undefined> = {
    categoryId: categoryId === undefined ? undefined : String(categoryId),
    roastLevel,
    keyword: keyword || undefined,
    page: page === defaultPage ? undefined : String(page),
    size: size === defaultSize ? undefined : String(size),
    sort: sort === defaultSort ? undefined : sort,
  }

  return {
    apiParams,
    urlParams,
    categoryId,
    roastLevel,
    keyword,
    page,
    size,
    sort,
  }
}

function buildProductsHref(
  currentParams: Record<string, string | undefined>,
  overrides: Record<string, string | undefined> = {}
) {
  const params = new URLSearchParams()
  const mergedParams = {
    ...currentParams,
    ...overrides,
  }

  for (const [key, value] of Object.entries(mergedParams)) {
    if (value !== undefined && value !== "") {
      params.set(key, value)
    }
  }

  const queryString = params.toString()

  return queryString ? `/products?${queryString}` : "/products"
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parsePositiveInteger(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function parseNonNegativeInteger(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}

function parseRoastLevel(value: string | undefined): RoastLevel | undefined {
  if (value === "LIGHT" || value === "MEDIUM" || value === "DARK") {
    return value
  }

  return undefined
}

function parseSort(value: string | undefined) {
  return sortOptions.some((option) => option.value === value)
    ? value
    : defaultSort
}

function getRoastLevelLabel(roastLevel: RoastLevel) {
  return (
    roastLevelOptions.find((option) => option.value === roastLevel)?.label ??
    roastLevel
  )
}

function getPageNumbers(totalPages: number, currentPage: number) {
  const firstPage = Math.max(currentPage - 2, 0)
  const lastPage = Math.min(firstPage + 5, totalPages)

  return Array.from(
    { length: lastPage - firstPage },
    (_, index) => firstPage + index
  )
}
