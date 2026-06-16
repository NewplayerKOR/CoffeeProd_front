"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  addCartItem,
  CART_CHANGED_EVENT,
  type AddCartItemRequest,
  type GrindType,
} from "@/lib/api/cart"
import type { ProductStatus } from "@/lib/api/catalog"
import { getStoredAuthTokens } from "@/lib/api/auth-token-storage"
import { ApiError } from "@/lib/api/types"

const grindOptions = [
  { value: "WHOLE_BEAN", label: "홀빈" },
  { value: "ESPRESSO", label: "에스프레소" },
  { value: "DRIP", label: "드립" },
  { value: "FRENCH_PRESS", label: "프렌치프레스" },
] satisfies Array<{ value: GrindType; label: string }>

type ProductPurchaseFormProps = {
  productId: number
  status: ProductStatus
  stockQuantity: number
}

export function ProductPurchaseForm({
  productId,
  status,
  stockQuantity,
}: ProductPurchaseFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [grindType, setGrindType] = useState<GrindType>("WHOLE_BEAN")
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<"success" | "error">("success")
  const isPurchasable = status === "ON_SALE" && stockQuantity > 0
  const maxQuantity = Math.min(Math.max(stockQuantity, 1), 99)
  const cartItemDraft: AddCartItemRequest = {
    productId,
    grindType,
    quantity,
  }

  function updateQuantity(nextQuantity: number) {
    setQuantity(Math.min(Math.max(nextQuantity, 1), maxQuantity))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isPurchasable || isSubmitting) {
      return
    }

    if (!getStoredAuthTokens()) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const updatedCart = await addCartItem(cartItemDraft)
      window.dispatchEvent(
        new CustomEvent(CART_CHANGED_EVENT, {
          detail: { totalQuantity: updatedCart.totalQuantity },
        })
      )
      setMessageTone("success")
      setMessage("장바구니에 상품을 담았습니다.")
    } catch (error) {
      if (error instanceof ApiError && error.kind === "UNAUTHORIZED") {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      setMessageTone("error")
      setMessage(
        error instanceof ApiError
          ? error.message
          : "장바구니에 담지 못했습니다."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="mt-6 flex flex-col gap-4"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="productId" value={cartItemDraft.productId} />
      <input type="hidden" name="grindType" value={cartItemDraft.grindType} />
      <input type="hidden" name="quantity" value={cartItemDraft.quantity} />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" htmlFor="grindType">
          분쇄 옵션
        </label>
        <select
          id="grindType"
          value={grindType}
          disabled={!isPurchasable}
          onChange={(event) => setGrindType(event.target.value as GrindType)}
          className="h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors focus:border-neutral-950 disabled:bg-neutral-100 disabled:text-neutral-400"
        >
          {grindOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" htmlFor="quantity">
          수량
        </label>
        <div className="flex w-fit items-center rounded-lg border border-neutral-300 bg-white">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!isPurchasable || quantity <= 1}
            onClick={() => updateQuantity(quantity - 1)}
            aria-label="수량 감소"
          >
            <Minus />
          </Button>
          <input
            id="quantity"
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            disabled={!isPurchasable}
            onChange={(event) => updateQuantity(Number(event.target.value))}
            className="h-8 w-16 border-0 bg-transparent text-center text-sm font-semibold outline-none disabled:text-neutral-400"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!isPurchasable || quantity >= maxQuantity}
            onClick={() => updateQuantity(quantity + 1)}
            aria-label="수량 증가"
          >
            <Plus />
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={
            messageTone === "success"
              ? "rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700"
              : "rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          }
          role="status"
        >
          <p>{message}</p>
          {messageTone === "success" && (
            <Link href="/cart" className="mt-2 inline-block underline">
              장바구니 보기
            </Link>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={!isPurchasable || isSubmitting}
        className="w-full"
      >
        <ShoppingCart data-icon="inline-start" />
        {isSubmitting ? "담는 중" : "장바구니 담기"}
      </Button>
    </form>
  )
}
