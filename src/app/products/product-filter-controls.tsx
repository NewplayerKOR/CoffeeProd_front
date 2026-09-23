"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SlidersHorizontal, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Category } from "@/lib/api/catalog"
import type { CoffeeReference } from "@/lib/api/coffee"

type FilterKey = "categoryId" | "processingMethodId" | "beanType" | "decaf" | "roastLevel"
type Draft = Record<FilterKey, string>
type Option = { value: string; label: string }

const filterKeys: FilterKey[] = ["categoryId", "processingMethodId", "beanType", "decaf", "roastLevel"]
const sorts = [
  { value: "createdAt,desc", label: "최신순" },
  { value: "price,asc", label: "가격 낮은순" },
  { value: "price,desc", label: "가격 높은순" },
]

function href(params: Record<string, string | undefined>, changes: Record<string, string | undefined>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...params, ...changes })) {
    if (value !== undefined && value !== "") query.set(key, value)
  }
  return query.size ? `/products?${query}` : "/products"
}

function selections(params: Record<string, string | undefined>): Draft {
  return Object.fromEntries(filterKeys.map((key) => [key, params[key] ?? ""])) as Draft
}

function activeLabels(
  params: Record<string, string | undefined>,
  categories: Category[],
  methods: CoffeeReference[],
  profileName: string | null
) {
  const labels: Array<{ key: string; label: string }> = []
  if (params.categoryId) labels.push({ key: "categoryId", label: categories.find((item) => String(item.id) === params.categoryId)?.name ?? "카테고리" })
  if (params.coffeeProfileId) labels.push({ key: "coffeeProfileId", label: profileName ?? "커피 프로필" })
  if (params.processingMethodId) labels.push({ key: "processingMethodId", label: methods.find((item) => String(item.id) === params.processingMethodId)?.name ?? "가공 방식" })
  if (params.beanType) labels.push({ key: "beanType", label: params.beanType === "BLEND" ? "블렌드" : "싱글 오리진" })
  if (params.decaf) labels.push({ key: "decaf", label: params.decaf === "true" ? "디카페인" : "일반 원두" })
  if (params.roastLevel) labels.push({ key: "roastLevel", label: { LIGHT: "라이트", MEDIUM: "미디엄", DARK: "다크" }[params.roastLevel] ?? params.roastLevel })
  if (params.keyword) labels.push({ key: "keyword", label: `검색: ${params.keyword}` })
  return labels
}

export function ProductFilterControls({
  params, categories, methods, profileName, total,
}: {
  params: Record<string, string | undefined>
  categories: Category[]
  methods: CoffeeReference[]
  profileName: string | null
  total: number | null
}) {
  const router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const [draft, setDraft] = useState<Draft>(() => selections(params))
  const [estimated, setEstimated] = useState<number | null>(total)
  const [countLoading, setCountLoading] = useState(false)
  const [clearAll, setClearAll] = useState(false)
  const labels = activeLabels(params, categories, methods, profileName)

  useEffect(() => {
    if (!dialog.current?.open) return
    if (!clearAll && filterKeys.every((key) => draft[key] === (params[key] ?? ""))) {
      return
    }
    let current = true
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      const query = new URLSearchParams()
      if (!clearAll && params.keyword) query.set("keyword", params.keyword)
      if (!clearAll && params.coffeeProfileId) query.set("coffeeProfileId", params.coffeeProfileId)
      for (const key of filterKeys) if (draft[key]) query.set(key, draft[key])
      fetch(`/api/products/count?${query}`, { signal: controller.signal })
        .then((response) => { if (!response.ok) throw new Error("Count unavailable"); return response.json() as Promise<{ total: number }> })
        .then((result) => { if (current) setEstimated(result.total) })
        .catch(() => { if (current) setEstimated(null) })
        .finally(() => { if (current) setCountLoading(false) })
    }, 250)
    return () => { current = false; window.clearTimeout(timer); controller.abort() }
  }, [draft, params, clearAll, total])

  function open() {
    setDraft(selections(params))
    setClearAll(false)
    setEstimated(total)
    setCountLoading(false)
    dialog.current?.showModal()
  }

  function close() {
    dialog.current?.close()
    opener.current?.focus()
  }

  function choose(key: FilterKey, value: string) {
    const next = { ...draft, [key]: value }
    const unchanged = !clearAll && filterKeys.every((filterKey) => next[filterKey] === (params[filterKey] ?? ""))
    setCountLoading(!unchanged)
    if (unchanged) setEstimated(total)
    setDraft(next)
  }

  function apply() {
    dialog.current?.close()
    router.push(href(params, { ...(clearAll ? { keyword: undefined, coffeeProfileId: undefined } : {}), ...draft, page: undefined }))
  }

  const groups: Array<{ key: FilterKey; label: string; options: Option[] }> = [
    { key: "categoryId", label: "카테고리", options: categories.map((item) => ({ value: String(item.id), label: item.name })) },
    { key: "processingMethodId", label: "가공 방식", options: methods.map((item) => ({ value: String(item.id), label: item.name })) },
    { key: "beanType", label: "원두 구성", options: [{ value: "SINGLE_ORIGIN", label: "싱글 오리진" }, { value: "BLEND", label: "블렌드" }] },
    { key: "decaf", label: "디카페인", options: [{ value: "false", label: "일반 원두" }, { value: "true", label: "디카페인" }] },
    { key: "roastLevel", label: "로스팅", options: [{ value: "LIGHT", label: "라이트" }, { value: "MEDIUM", label: "미디엄" }, { value: "DARK", label: "다크" }] },
  ]

  return (
    <div className="catalog-controls">
      <div className="catalog-control-row">
        <Button ref={opener} type="button" variant="outline" className="catalog-filter-trigger" onClick={open}>
          <SlidersHorizontal data-icon="inline-start" /> 필터{labels.length > 0 && <span className="catalog-filter-count">{labels.length}</span>}
        </Button>
        <label className="catalog-sort-label">정렬
          <select aria-label="상품 정렬" value={params.sort ?? "createdAt,desc"} onChange={(event) => router.push(href(params, { sort: event.target.value, page: undefined }))}>
            {sorts.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </div>
      {labels.length > 0 && <div className="catalog-active-filters" aria-label="적용된 검색 조건">
        {labels.map((item) => <Link key={item.key} className="catalog-active-chip" href={href(params, { [item.key]: undefined, page: undefined })} aria-label={`${item.label} 조건 해제`}>{item.label}<X size={14} aria-hidden="true" /></Link>)}
      </div>}
      <dialog ref={dialog} className="catalog-filter-dialog" aria-label="상품 필터" onCancel={(event) => { event.preventDefault(); close() }}>
        <div className="catalog-filter-panel">
          <header><h2>상품 필터</h2><button type="button" aria-label="필터 닫기" onClick={close}><X /></button></header>
          <div className="catalog-filter-panel-body">
            {groups.map((group) => <fieldset key={group.key}>
              <legend>{group.label}</legend>
              <div className="catalog-filter-options">
                {[{ value: "", label: "전체" }, ...group.options].map((option) => <label key={option.value} data-selected={draft[group.key] === option.value}>
                  <input type="radio" name={group.key} value={option.value} checked={draft[group.key] === option.value} onChange={() => choose(group.key, option.value)} />
                  {option.label}
                </label>)}
              </div>
            </fieldset>)}
          </div>
          <footer>
            <p aria-live="polite">{countLoading ? "결과 확인 중" : estimated === null ? "결과 수를 확인할 수 없습니다" : `예상 결과 ${estimated.toLocaleString()}개`}</p>
            <div><Button type="button" variant="outline" onClick={() => { setCountLoading(true); setClearAll(true); setDraft(selections({})) }}>전체 초기화</Button><Button type="button" onClick={apply}>적용</Button></div>
          </footer>
        </div>
      </dialog>
    </div>
  )
}
