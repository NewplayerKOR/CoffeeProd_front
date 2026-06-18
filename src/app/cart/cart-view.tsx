"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  clearCart,
  deleteCartItem,
  getCart,
  updateCartItem,
  type Cart,
  type CartItem,
  type GrindType,
} from "@/lib/api/cart"
import { getStoredAuthTokens } from "@/lib/api/auth-token-storage"
import { ApiError } from "@/lib/api/types"
import { calculateEstimatedDeliveryFee } from "@/lib/order-pricing"
import { ProductImage } from "@/app/products/product-image"

const emptyCart: Cart = {
  items: [],
  totalPrice: 0,
  totalQuantity: 0,
}

const grindOptions = [
  { value: "WHOLE_BEAN", label: "홀빈" },
  { value: "ESPRESSO", label: "에스프레소" },
  { value: "DRIP", label: "드립" },
  { value: "FRENCH_PRESS", label: "프렌치프레스" },
] satisfies Array<{ value: GrindType; label: string }>

type CartStatus = "checking" | "guest" | "ready"

export function CartView() {
  const [cart, setCart] = useState<Cart>(emptyCart)
  const [status, setStatus] = useState<CartStatus>("checking")
  const [pendingItemId, setPendingItemId] = useState<number | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const hasItems = cart.items.length > 0
  const shippingFee = calculateEstimatedDeliveryFee(cart.totalPrice)
  const orderTotal = cart.totalPrice + shippingFee

  useEffect(() => {
    let isActive = true

    async function loadCart() {
      if (!getStoredAuthTokens()) {
        if (isActive) {
          setStatus("guest")
        }
        return
      }

      try {
        const nextCart = await getCart()

        if (isActive) {
          setCart(nextCart)
          setStatus("ready")
        }
      } catch (error) {
        if (error instanceof ApiError && error.kind === "UNAUTHORIZED") {
          if (isActive) {
            setStatus("guest")
          }
          return
        }

        if (isActive) {
          setMessage(
            error instanceof ApiError
              ? error.message
              : "장바구니를 불러오지 못했습니다."
          )
          setStatus("ready")
        }
      }
    }

    void loadCart()

    return () => {
      isActive = false
    }
  }, [])

  async function handleUpdateItem(item: CartItem, nextQuantity: number) {
    if (nextQuantity <= 0) {
      await handleDeleteItem(item.cartItemId)
      return
    }

    setPendingItemId(item.cartItemId)
    setMessage(null)

    try {
      const nextCart = await updateCartItem(item.cartItemId, {
        quantity: nextQuantity,
        grindType: item.grindType,
      })
      setCart(nextCart)
    } catch (error) {
      setMessage(getCartErrorMessage(error))
    } finally {
      setPendingItemId(null)
    }
  }

  async function handleUpdateGrindType(item: CartItem, grindType: GrindType) {
    setPendingItemId(item.cartItemId)
    setMessage(null)

    try {
      const nextCart = await updateCartItem(item.cartItemId, {
        quantity: item.quantity,
        grindType,
      })
      setCart(nextCart)
    } catch (error) {
      setMessage(getCartErrorMessage(error))
    } finally {
      setPendingItemId(null)
    }
  }

  async function handleDeleteItem(cartItemId: number) {
    setPendingItemId(cartItemId)
    setMessage(null)

    try {
      const nextCart = await deleteCartItem(cartItemId)
      setCart(nextCart)
    } catch (error) {
      setMessage(getCartErrorMessage(error))
    } finally {
      setPendingItemId(null)
    }
  }

  async function handleClearCart() {
    setIsClearing(true)
    setMessage(null)

    try {
      await clearCart()
      setCart(emptyCart)
    } catch (error) {
      setMessage(getCartErrorMessage(error))
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ShoppingBag className="size-5" />
            CoffeeProd
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" asChild>
              <Link href="/products">
                <ArrowLeft data-icon="inline-start" />
                쇼핑 계속하기
              </Link>
            </Button>
          </div>
        </header>

        <section className="mb-8">
          <p className="text-sm font-medium text-neutral-500">Cart</p>
          <h1 className="mt-2 text-3xl font-bold">장바구니</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            담은 상품의 수량과 분쇄 옵션을 확인하고 주문으로 이어갑니다.
          </p>
        </section>

        {status === "checking" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
            장바구니를 확인하고 있습니다.
          </section>
        )}

        {status === "guest" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
              <ShoppingCart className="size-6 text-neutral-500" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">로그인이 필요합니다.</h2>
            <p className="mt-3 text-sm text-neutral-600">
              장바구니는 로그인 후 이용할 수 있습니다.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/login?redirect=/cart">로그인하기</Link>
            </Button>
          </section>
        )}

        {status === "ready" && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex flex-col gap-4">
              {message && (
                <p
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                  role="alert"
                >
                  {message}
                </p>
              )}

              {!hasItems && (
                <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
                    <ShoppingCart className="size-6 text-neutral-500" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold">
                    장바구니가 비어 있습니다.
                  </h2>
                  <p className="mt-3 text-sm text-neutral-600">
                    원하는 커피를 골라 장바구니에 담아보세요.
                  </p>
                  <Button className="mt-6" asChild>
                    <Link href="/products">상품 보러가기</Link>
                  </Button>
                </div>
              )}

              {cart.items.map((item) => {
                const isPending = pendingItemId === item.cartItemId

                return (
                  <article
                    key={item.cartItemId}
                    className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm md:grid-cols-[112px_minmax(0,1fr)]"
                  >
                    <Link
                      href={`/products/${item.productId}`}
                      className="block overflow-hidden rounded-lg bg-neutral-100"
                    >
                      <div className="aspect-square">
                        <ProductImage
                          src={item.imageUrl}
                          alt={item.productName}
                        />
                      </div>
                    </Link>

                    <div className="min-w-0">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.productId}`}
                            className="text-lg font-semibold hover:underline"
                          >
                            {item.productName}
                          </Link>
                          <p className="mt-1 text-sm text-neutral-500">
                            {item.price.toLocaleString()}원
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDeleteItem(item.cartItemId)}
                        >
                          <Trash2 data-icon="inline-start" />
                          삭제
                        </Button>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label
                            className="text-sm font-semibold"
                            htmlFor={`grindType-${item.cartItemId}`}
                          >
                            분쇄 옵션
                          </label>
                          <select
                            id={`grindType-${item.cartItemId}`}
                            value={item.grindType}
                            disabled={isPending}
                            onChange={(event) =>
                              handleUpdateGrindType(
                                item,
                                event.target.value as GrindType
                              )
                            }
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
                          <span className="text-sm font-semibold">수량</span>
                          <div className="flex w-fit items-center rounded-lg border border-neutral-300 bg-white">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={isPending || item.quantity <= 1}
                              onClick={() =>
                                handleUpdateItem(item, item.quantity - 1)
                              }
                              aria-label="수량 감소"
                            >
                              <Minus />
                            </Button>
                            <span className="inline-flex h-8 w-14 items-center justify-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={isPending}
                              onClick={() =>
                                handleUpdateItem(item, item.quantity + 1)
                              }
                              aria-label="수량 증가"
                            >
                              <Plus />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-neutral-200 pt-4">
                        <span className="text-sm text-neutral-500">상품 금액</span>
                        <span className="font-bold">
                          {item.totalPrice.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">주문 요약</h2>
              <div className="mt-5 flex flex-col gap-3 border-y border-neutral-200 py-4 text-sm">
                <SummaryRow
                  label="상품 수량"
                  value={`${cart.totalQuantity.toLocaleString()}개`}
                />
                <SummaryRow
                  label="상품 금액"
                  value={`${cart.totalPrice.toLocaleString()}원`}
                />
                <SummaryRow
                  label="배송비"
                  value={shippingFee === 0 ? "무료" : `${shippingFee.toLocaleString()}원`}
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-semibold">결제 예정 금액</span>
                <span className="text-xl font-bold">
                  {orderTotal.toLocaleString()}원
                </span>
              </div>

              <Button className="mt-6 w-full" disabled={!hasItems} asChild={hasItems}>
                {hasItems ? <Link href="/checkout">주문하기</Link> : <span>주문하기</span>}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="mt-2 w-full"
                disabled={!hasItems || isClearing}
                onClick={handleClearCart}
              >
                <Trash2 data-icon="inline-start" />
                {isClearing ? "비우는 중" : "장바구니 비우기"}
              </Button>
            </aside>
          </section>
        )}
      </div>
    </main>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-neutral-500">{label}</span>
      <span className="font-semibold text-neutral-900">{value}</span>
    </div>
  )
}

function getCartErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "장바구니 요청을 처리하지 못했습니다."
}
