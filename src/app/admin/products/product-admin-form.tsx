"use client"

import { useRouter } from "next/navigation"
import { Check, ImageIcon, PackagePlus, RotateCcw } from "lucide-react"
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import {
  createAdminProduct,
  getAdminProduct,
  updateAdminProduct,
  type AdminProductRequest,
} from "@/lib/api/admin"
import {
  getCategories,
  type Category,
  type ProductDetail,
  type RoastLevel,
} from "@/lib/api/catalog"
import { ApiError } from "@/lib/api/types"

type ProductAdminFormProps = {
  mode: "create" | "edit"
  productId?: string
}

type ProductFormState = {
  categoryId: string
  name: string
  price: string
  stockQuantity: string
  roastLevel: RoastLevel
  description: string
  image_url: string
}

type ProductFormErrors = Partial<Record<keyof ProductFormState, string>>

const initialFormState: ProductFormState = {
  categoryId: "",
  name: "",
  price: "",
  stockQuantity: "",
  roastLevel: "MEDIUM",
  description: "",
  image_url: "",
}

const roastLevelOptions = [
  { value: "LIGHT", label: "라이트" },
  { value: "MEDIUM", label: "미디엄" },
  { value: "DARK", label: "다크" },
] satisfies Array<{ value: RoastLevel; label: string }>

const inputClassName =
  "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950 disabled:bg-neutral-100 disabled:text-neutral-400"
const textareaClassName =
  "min-h-40 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950 disabled:bg-neutral-100 disabled:text-neutral-400"
const fieldErrorClassName = "mt-1.5 text-xs font-medium text-red-600"

export function ProductAdminForm({ mode, productId }: ProductAdminFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<ProductFormState>(initialFormState)
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<"success" | "error">(
    "success"
  )
  const [isLoading, setIsLoading] = useState(mode === "edit")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = useMemo(
    () => (mode === "create" ? "상품 등록" : "상품 수정"),
    [mode]
  )

  useEffect(() => {
    let isActive = true

    async function loadFormData() {
      setIsLoading(true)
      setMessage(null)

      try {
        const [nextCategories, product] = await Promise.all([
          getCategories(),
          mode === "edit" && productId
            ? getAdminProduct(productId)
            : Promise.resolve(null),
        ])

        if (!isActive) {
          return
        }

        setCategories(nextCategories)

        if (product) {
          setForm(toFormState(product))
        }
      } catch (error) {
        if (isActive) {
          setMessageTone("error")
          setMessage(getAdminErrorMessage(error))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadFormData()

    return () => {
      isActive = false
    }
  }, [mode, productId])

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const field = event.currentTarget.name as keyof ProductFormState
    const { value } = event.currentTarget

    setForm((current) => ({
      ...current,
      [field]: value,
    }))
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }))
    setMessage(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateProductForm(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setMessageTone("error")
      setMessage("상품 입력값을 다시 확인해 주세요.")
      return
    }

    const payload = toProductRequest(form)

    setIsSubmitting(true)
    setMessage(null)

    try {
      if (mode === "edit" && productId) {
        await updateAdminProduct(productId, payload)
        setMessageTone("success")
        setMessage("상품 정보를 수정했습니다.")
      } else {
        await createAdminProduct(payload)
        router.replace("/admin/products")
      }
    } catch (error) {
      setMessageTone("error")
      setMessage(getAdminErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setForm(initialFormState)
    setErrors({})
    setMessage(null)
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <PackagePlus className="size-5 text-neutral-500" />
        <h2 className="text-lg font-bold">{title}</h2>
      </div>

      {message && (
        <p
          className={
            messageTone === "success"
              ? "mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700"
              : "mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          }
          role={messageTone === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      {isLoading ? (
        <p className="mt-5 text-sm text-neutral-600">
          상품 입력 정보를 불러오고 있습니다.
        </p>
      ) : (
        <form className="mt-5 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="카테고리" error={errors.categoryId}>
            <select
              name="categoryId"
              value={form.categoryId}
              disabled={isSubmitting}
              className={inputClassName}
              aria-invalid={Boolean(errors.categoryId)}
              onChange={handleInputChange}
            >
              <option value="">카테고리 선택</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="로스팅" error={errors.roastLevel}>
            <select
              name="roastLevel"
              value={form.roastLevel}
              disabled={isSubmitting}
              className={inputClassName}
              aria-invalid={Boolean(errors.roastLevel)}
              onChange={handleInputChange}
            >
              {roastLevelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <TextField
            label="상품명"
            name="name"
            value={form.name}
            error={errors.name}
            disabled={isSubmitting}
            placeholder="예: House Blend"
            onChange={handleInputChange}
          />
          <TextField
            label="가격"
            name="price"
            type="number"
            min={0}
            value={form.price}
            error={errors.price}
            disabled={isSubmitting}
            placeholder="15000"
            onChange={handleInputChange}
          />
          <TextField
            label="재고 수량"
            name="stockQuantity"
            type="number"
            min={0}
            value={form.stockQuantity}
            error={errors.stockQuantity}
            disabled={isSubmitting}
            placeholder="20"
            onChange={handleInputChange}
          />
          <TextField
            label="이미지 URL"
            name="image_url"
            value={form.image_url}
            error={errors.image_url}
            disabled={isSubmitting}
            placeholder="https://example.com/image.jpg"
            onChange={handleInputChange}
          />

          <Field
            label="상품 설명"
            error={errors.description}
            className="md:col-span-2"
          >
            <textarea
              name="description"
              value={form.description}
              disabled={isSubmitting}
              className={textareaClassName}
              aria-invalid={Boolean(errors.description)}
              onChange={handleInputChange}
            />
          </Field>

          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              <Check data-icon="inline-start" />
              {isSubmitting ? "저장 중" : "저장"}
            </Button>
            {mode === "create" && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={resetForm}
              >
                <RotateCcw data-icon="inline-start" />
                초기화
              </Button>
            )}
            <Button type="button" variant="outline" asChild>
              <a href={form.image_url || "#"} target="_blank" rel="noreferrer">
                <ImageIcon data-icon="inline-start" />
                이미지 확인
              </a>
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={className ? `block ${className}` : "block"}>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {children}
      {error && <span className={fieldErrorClassName}>{error}</span>}
    </label>
  )
}

function TextField({
  label,
  name,
  value,
  error,
  disabled,
  placeholder,
  type = "text",
  min,
  onChange,
}: {
  label: string
  name: keyof ProductFormState
  value: string
  error?: string
  disabled: boolean
  placeholder?: string
  type?: "text" | "number"
  min?: number
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void
}) {
  return (
    <Field label={label} error={error}>
      <input
        name={name}
        type={type}
        min={min}
        value={value}
        disabled={disabled}
        className={inputClassName}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={onChange}
      />
    </Field>
  )
}

function validateProductForm(values: ProductFormState) {
  const errors: ProductFormErrors = {}
  const categoryId = Number(values.categoryId)
  const price = Number(values.price)
  const stockQuantity = Number(values.stockQuantity)

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    errors.categoryId = "카테고리를 선택해 주세요."
  }

  if (!values.name.trim()) {
    errors.name = "상품명을 입력해 주세요."
  }

  if (!Number.isInteger(price) || price < 0) {
    errors.price = "가격은 0 이상의 정수로 입력해 주세요."
  }

  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    errors.stockQuantity = "재고 수량은 0 이상의 정수로 입력해 주세요."
  }

  if (!values.description.trim()) {
    errors.description = "상품 설명을 입력해 주세요."
  }

  if (!values.image_url.trim()) {
    errors.image_url = "이미지 URL을 입력해 주세요."
  }

  return errors
}

function toProductRequest(values: ProductFormState): AdminProductRequest {
  return {
    categoryId: Number(values.categoryId),
    name: values.name.trim(),
    price: Number(values.price),
    stockQuantity: Number(values.stockQuantity),
    roastLevel: values.roastLevel,
    description: values.description.trim(),
    image_url: values.image_url.trim(),
  }
}

function toFormState(product: ProductDetail): ProductFormState {
  return {
    categoryId: String(product.categoryId),
    name: product.name,
    price: String(product.price),
    stockQuantity: String(product.stockQuantity),
    roastLevel: product.roastLevel,
    description: product.description,
    image_url: product.imageUrl ?? "",
  }
}

function getAdminErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "관리자 요청을 처리하지 못했습니다."
}
