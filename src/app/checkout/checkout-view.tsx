"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Home,
  MapPin,
  PackageCheck,
  ShoppingCart,
} from "lucide-react"
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { getAddresses, type Address } from "@/lib/api/address"
import { getMe, type Member } from "@/lib/api/auth"
import { getStoredAuthTokens } from "@/lib/api/auth-token-storage"
import { getCart, type Cart } from "@/lib/api/cart"
import { createOrder } from "@/lib/api/order"
import { ApiError } from "@/lib/api/types"
import { calculateEstimatedDeliveryFee } from "@/lib/order-pricing"

import { CartNavButton } from "../cart/cart-nav-button"

const emptyCart: Cart = {
  items: [],
  totalPrice: 0,
  totalQuantity: 0,
}

type CheckoutStatus = "checking" | "guest" | "ready"

export function CheckoutView() {
  const router = useRouter()
  const [status, setStatus] = useState<CheckoutStatus>("checking")
  const [member, setMember] = useState<Member | null>(null)
  const [cart, setCart] = useState<Cart>(emptyCart)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [usedMileage, setUsedMileage] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasItems = cart.items.length > 0
  const maxMileage = useMemo(() => {
    if (!member) {
      return 0
    }

    return Math.min(member.mileage, cart.totalPrice)
  }, [cart.totalPrice, member])
  const estimatedDeliveryFee = calculateEstimatedDeliveryFee(cart.totalPrice)
  const expectedPayment = Math.max(
    cart.totalPrice - usedMileage + estimatedDeliveryFee,
    0
  )

  useEffect(() => {
    let isActive = true

    async function loadCheckoutData() {
      if (!getStoredAuthTokens()) {
        if (isActive) {
          setStatus("guest")
        }
        return
      }

      try {
        const [currentMember, currentCart, currentAddresses] = await Promise.all([
          getMe(),
          getCart(),
          getAddresses(),
        ])

        if (!isActive) {
          return
        }

        const defaultAddress =
          currentAddresses.find((address) => address.isDefault === true) ??
          currentAddresses[0] ??
          null

        setMember(currentMember)
        setCart(currentCart)
        setAddresses(currentAddresses)
        setSelectedAddressId(defaultAddress?.id ?? null)
        setStatus("ready")
      } catch (error) {
        if (error instanceof ApiError && error.kind === "UNAUTHORIZED") {
          if (isActive) {
            setStatus("guest")
          }
          return
        }

        if (isActive) {
          setMessage(getCheckoutErrorMessage(error))
          setStatus("ready")
        }
      }
    }

    void loadCheckoutData()

    return () => {
      isActive = false
    }
  }, [])

  function handleMileageChange(event: ChangeEvent<HTMLInputElement>) {
    const nextMileage = Number(event.currentTarget.value)

    if (!Number.isFinite(nextMileage)) {
      setUsedMileage(0)
      return
    }

    setUsedMileage(Math.min(Math.max(Math.trunc(nextMileage), 0), maxMileage))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!hasItems) {
      setMessage("장바구니에 담긴 상품이 없습니다.")
      return
    }

    if (!selectedAddressId) {
      setMessage("배송지를 선택해 주세요.")
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const order = await createOrder({
        addressId: selectedAddressId,
        usedMileage,
      })

      router.replace(
        `/checkout/payment?orderId=${order.orderId}&tossOrderId=${encodeURIComponent(
          order.tossOrderId
        )}&amount=${order.totalPrice}`
      )
    } catch (error) {
      setMessage(getCheckoutErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Home className="size-5" />
            CoffeeProd
          </Link>

          <CartNavButton />
        </header>

        <section className="mb-8">
          <p className="text-sm font-medium text-neutral-500">Checkout</p>
          <h1 className="mt-2 text-3xl font-bold">주문서 작성</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            배송지와 사용 마일리지를 선택해 주문을 생성합니다.
          </p>
        </section>

        {status === "checking" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
            주문 정보를 확인하고 있습니다.
          </section>
        )}

        {status === "guest" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
              <ShoppingCart className="size-6 text-neutral-500" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">로그인이 필요합니다.</h2>
            <p className="mt-3 text-sm text-neutral-600">
              주문서는 로그인 후 작성할 수 있습니다.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/login?redirect=/checkout">로그인하기</Link>
            </Button>
          </section>
        )}

        {status === "ready" && (
          <form
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-6">
              {message && (
                <p
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                  role="alert"
                >
                  {message}
                </p>
              )}

              <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">배송지</h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      주문에 사용할 배송지를 선택합니다.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/me/addresses">
                      <MapPin data-icon="inline-start" />
                      배송지 관리
                    </Link>
                  </Button>
                </div>

                {addresses.length === 0 ? (
                  <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                    등록된 배송지가 없습니다. 배송지를 먼저 등록해 주세요.
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className="flex cursor-pointer gap-3 rounded-lg border border-neutral-200 bg-white p-4 has-checked:border-neutral-950"
                      >
                        <input
                          type="radio"
                          name="addressId"
                          value={address.id}
                          checked={selectedAddressId === address.id}
                          className="mt-1 size-4"
                          onChange={() => setSelectedAddressId(address.id)}
                        />
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">
                              {address.recipient}
                            </span>
                            {address.isDefault && (
                              <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-medium text-white">
                                기본 배송지
                              </span>
                            )}
                          </span>
                          <span className="mt-2 block text-sm text-neutral-600">
                            {address.phone}
                          </span>
                          <span className="mt-1 block text-sm leading-6 text-neutral-700">
                            [{address.zipcode}] {address.addressLine1}
                            {address.addressLine2
                              ? ` ${address.addressLine2}`
                              : ""}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold">주문 상품</h2>
                {cart.items.length === 0 ? (
                  <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                    장바구니에 담긴 상품이 없습니다.
                  </div>
                ) : (
                  <div className="mt-5 flex flex-col gap-3">
                    {cart.items.map((item) => (
                      <div
                        key={item.cartItemId}
                        className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold">{item.productName}</p>
                          <p className="mt-1 text-sm text-neutral-500">
                            {getGrindTypeLabel(item.grindType)} / {item.quantity}
                            개
                          </p>
                        </div>
                        <p className="shrink-0 font-bold">
                          {item.totalPrice.toLocaleString()}원
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold">마일리지</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  보유 마일리지 안에서 주문 금액까지 사용할 수 있습니다.
                </p>
                <div className="mt-5 max-w-sm">
                  <label
                    htmlFor="usedMileage"
                    className="mb-2 block text-sm font-semibold"
                  >
                    사용 마일리지
                  </label>
                  <input
                    id="usedMileage"
                    name="usedMileage"
                    type="number"
                    min={0}
                    max={maxMileage}
                    value={usedMileage}
                    disabled={!hasItems}
                    className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors focus:border-neutral-950 disabled:bg-neutral-100 disabled:text-neutral-400"
                    onChange={handleMileageChange}
                  />
                  <p className="mt-2 text-sm text-neutral-500">
                    사용 가능: {maxMileage.toLocaleString()}P
                  </p>
                </div>
              </section>
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
                  label="예상 배송비"
                  value={
                    estimatedDeliveryFee === 0
                      ? "무료"
                      : `${estimatedDeliveryFee.toLocaleString()}원`
                  }
                />
                <SummaryRow
                  label="사용 마일리지"
                  value={`-${usedMileage.toLocaleString()}P`}
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <span className="font-semibold">결제 예정 금액</span>
                <span className="text-xl font-bold">
                  {expectedPayment.toLocaleString()}원
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                최종 배송비와 결제 금액은 주문 생성 시 서버에서 확정됩니다.
              </p>

              <Button
                type="submit"
                className="mt-6 w-full"
                disabled={!hasItems || !selectedAddressId || isSubmitting}
              >
                <PackageCheck data-icon="inline-start" />
                {isSubmitting ? "주문 생성 중" : "주문 생성"}
              </Button>
            </aside>
          </form>
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

function getCheckoutErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "주문 요청을 처리하지 못했습니다."
}

function getGrindTypeLabel(grindType: string) {
  if (grindType === "WHOLE_BEAN") {
    return "홀빈"
  }

  if (grindType === "ESPRESSO") {
    return "에스프레소"
  }

  if (grindType === "DRIP") {
    return "드립"
  }

  return "프렌치프레스"
}
