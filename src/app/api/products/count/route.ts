import { getProducts, type ProductListParams } from "@/lib/api/catalog"

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams
  const params: ProductListParams = { page: 0, size: 1 }

  for (const key of ["categoryId", "coffeeProfileId", "processingMethodId"] as const) {
    const value = Number(search.get(key))
    if (Number.isInteger(value) && value > 0) params[key] = value
  }

  const beanType = search.get("beanType")
  if (beanType === "BLEND" || beanType === "SINGLE_ORIGIN") params.beanType = beanType

  const decaf = search.get("decaf")
  if (decaf === "true" || decaf === "false") params.decaf = decaf === "true"

  const roastLevel = search.get("roastLevel")
  if (roastLevel === "LIGHT" || roastLevel === "MEDIUM" || roastLevel === "DARK") params.roastLevel = roastLevel

  const keyword = search.get("keyword")?.trim()
  if (keyword) params.keyword = keyword

  try {
    const products = await getProducts(params, { cache: "no-store" })
    return Response.json({ total: products.totalElements })
  } catch {
    return Response.json({ error: "결과 수를 확인할 수 없습니다." }, { status: 502 })
  }
}
