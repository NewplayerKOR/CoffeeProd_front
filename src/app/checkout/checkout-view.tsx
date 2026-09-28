"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CircleAlert,
  Home,
  MapPin,
  PackageCheck,
  RotateCw,
  ShoppingCart,
} from "lucide-react"
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import { getAddresses, type Address } from "@/lib/api/address"
import { getMe, type Member } from "@/lib/api/auth"
import { getStoredAuthTokens } from "@/lib/api/auth-token-storage"
import { getCart, type Cart } from "@/lib/api/cart"
import { createOrder } from "@/lib/api/order"
import { ApiError } from "@/lib/api/types"
import { calculateEstimatedDeliveryFee } from "@/lib/order-pricing"

import { CartNavButton } from "../cart/cart-nav-button"

type CheckoutStatus = "checking" | "guest" | "ready"
type ResourceStatus = "checking" | "ready" | "error"

export function CheckoutView() {
  const router = useRouter()
  const loadRequestId = useRef(0)
  const [status, setStatus] = useState<CheckoutStatus>("checking")
  const [member, setMember] = useState<Member | null>(null)
  const [cart, setCart] = useState<Cart | null>(null)
  const [addresses, setAddresses] = useState<Address[] | null>(null)
  const [memberStatus, setMemberStatus] = useState<ResourceStatus>("checking")
  const [cartStatus, setCartStatus] = useState<ResourceStatus>("checking")
  const [addressesStatus, setAddressesStatus] = useState<ResourceStatus>("checking")
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [usedMileage, setUsedMileage] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasItems = (cart?.items.length ?? 0) > 0
  const cartTotalPrice = cart?.totalPrice ?? 0
  const hasLoadError =
    memberStatus === "error" ||
    cartStatus === "error" ||
    addressesStatus === "error"
  const maxMileage = useMemo(() => {
    if (!member || cartStatus !== "ready") {
      return 0
    }

    return Math.min(member.mileage, cartTotalPrice)
  }, [cartStatus, cartTotalPrice, member])
  const estimatedDeliveryFee = calculateEstimatedDeliveryFee(cartTotalPrice)
  const expectedPayment = Math.max(
    cartTotalPrice - usedMileage + estimatedDeliveryFee,
    0
  )

  const loadCheckoutData = useCallback(async () => {
    const requestId = ++loadRequestId.current

    if (!getStoredAuthTokens()) {
      setStatus("guest")
      return
    }

    setStatus("checking")
    setMessage(null)
    setMember(null)
    setCart(null)
    setAddresses(null)
    setMemberStatus("checking")
    setCartStatus("checking")
    setAddressesStatus("checking")
    setSelectedAddressId(null)
    setUsedMileage(0)

    const [memberResult, cartResult, addressesResult] = await Promise.allSettled([
      getMe(),
      getCart(),
      getAddresses(),
    ])

    if (requestId !== loadRequestId.current) {
      return
    }

    if ([memberResult, cartResult, addressesResult].some(isUnauthorizedResult)) {
      setStatus("guest")
      return
    }

    if (memberResult.status === "fulfilled") {
      setMember(memberResult.value)
      setMemberStatus("ready")
    } else {
      setMemberStatus("error")
    }

    if (cartResult.status === "fulfilled") {
      setCart(cartResult.value)
      setCartStatus("ready")
    } else {
      setCartStatus("error")
    }

    if (addressesResult.status === "fulfilled") {
      const defaultAddress =
        addressesResult.value.find((address) => address.isDefault === true) ??
        addressesResult.value[0] ??
        null

      setAddresses(addressesResult.value)
      setSelectedAddressId(defaultAddress?.id ?? null)
      setAddressesStatus("ready")
    } else {
      setAddressesStatus("error")
    }

    setStatus("ready")
  }, [])

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => {
      void loadCheckoutData()
    }, 0)

    return () => {
      window.clearTimeout(initialLoadId)
      loadRequestId.current += 1
    }
  }, [loadCheckoutData])

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
    <main className="order-page min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Home className="size-5" />
            CoffeeProd
          </Link>

          <CartNavButton />
        </header>

        <section className="mb-8">
          <h1 className="mt-2 text-3xl font-bold">주문서 작성</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            배송지와 사용할 마일리지를 선택해 주세요.
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
            <h2 className="mt-5 text-xl font-bold sm:text-2xl">로그인이 필요합니다.</h2>
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
              {hasLoadError && (
                <div
                  className="flex flex-col gap-4 border-l-4 border-red-500 bg-red-50 px-4 py-4 text-red-900 sm:flex-row sm:items-center sm:justify-between"
                  role="alert"
                >
                  <div className="flex gap-3">
                    <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                    <div>
                      <h2 className="font-bold">일부 주문 정보를 확인하지 못했습니다.</h2>
                      <p className="mt-1 text-sm leading-6 text-red-800">
                        확인되지 않은 항목은 빈 상태로 표시하지 않았습니다. 연결을 확인한 뒤 다시 시도해 주세요.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 border-red-300 bg-white text-red-800 hover:bg-red-100"
                    onClick={() => void loadCheckoutData()}
                  >
                    <RotateCw data-icon="inline-start" /> 다시 시도
                  </Button>
                </div>
              )}

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

                {addressesStatus === "error" ? (
                  <ResourceLoadError
                    title="배송지를 불러오지 못했습니다."
                    description="등록된 배송지가 없는 것으로 처리하지 않았습니다. 다시 시도해 주세요."
                    onRetry={loadCheckoutData}
                  />
                ) : addresses?.length === 0 ? (
                  <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                    등록된 배송지가 없습니다. 배송지를 먼저 등록해 주세요.
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3">
                    {addresses?.map((address) => (
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
                {cartStatus === "error" ? (
                  <ResourceLoadError
                    title="장바구니 상품을 불러오지 못했습니다."
                    description="장바구니가 비어 있는 것으로 처리하지 않았습니다. 장바구니를 확인한 뒤 다시 시도해 주세요."
                    onRetry={loadCheckoutData}
                  />
                ) : cart?.items.length === 0 ? (
                  <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                    장바구니에 담긴 상품이 없습니다.
                  </div>
                ) : (
                  <div className="mt-5 flex flex-col gap-3">
                    {cart?.items.map((item) => (
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
                {memberStatus === "error" ? (
                  <ResourceLoadError
                    title="보유 마일리지를 확인하지 못했습니다."
                    description="마일리지를 0으로 확정하지 않았습니다. 다시 시도해 주세요."
                    onRetry={loadCheckoutData}
                  />
                ) : (
                  <>
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
                  </>
                )}
              </section>
            </div>

            <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">주문 요약</h2>
              <div className="mt-5 flex flex-col gap-3 border-y border-neutral-200 py-4 text-sm">
                <SummaryRow
                  label="상품 수량"
                  value={
                    cartStatus === "ready"
                      ? `${(cart?.totalQuantity ?? 0).toLocaleString()}개`
                      : "확인 필요"
                  }
                />
                <SummaryRow
                  label="상품 금액"
                  value={
                    cartStatus === "ready"
                      ? `${cartTotalPrice.toLocaleString()}원`
                      : "확인 필요"
                  }
                />
                <SummaryRow
                  label="예상 배송비"
                  value={
                    cartStatus !== "ready"
                      ? "확인 필요"
                      : estimatedDeliveryFee === 0
                        ? "무료"
                        : `${estimatedDeliveryFee.toLocaleString()}원`
                  }
                />
                <SummaryRow
                  label="사용 마일리지"
                  value={
                    memberStatus === "ready"
                      ? `-${usedMileage.toLocaleString()}P`
                      : "확인 필요"
                  }
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <span className="font-semibold">결제 예정 금액</span>
                <span className="text-xl font-bold">
                  {cartStatus === "ready" && memberStatus === "ready"
                    ? `${expectedPayment.toLocaleString()}원`
                    : "확인 필요"}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                최종 배송비와 결제 금액은 다음 결제 화면에서 확인해 주세요.
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                계속하면 주문이 접수되고 결제 화면으로 이동합니다.
              </p>

              <Button
                type="submit"
                className="mt-6 w-full"
                disabled={
                  hasLoadError ||
                  !hasItems ||
                  !selectedAddressId ||
                  isSubmitting
                }
              >
                <PackageCheck data-icon="inline-start" />
                {isSubmitting ? "결제 화면 준비 중" : "결제 화면으로 이동"}
              </Button>
            </aside>
          </form>
        )}
      </div>
    </main>
  )
}

function ResourceLoadError({
  title,
  description,
  onRetry,
}: {
  title: string
  description: string
  onRetry: () => Promise<void>
}) {
  return (
    <div className="mt-5 border-l-4 border-red-400 bg-red-50 px-4 py-4 text-sm text-red-900">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 leading-6 text-red-800">{description}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4 border-red-300 bg-white text-red-800 hover:bg-red-100"
        onClick={() => void onRetry()}
      >
        <RotateCw data-icon="inline-start" /> 다시 시도
      </Button>
    </div>
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
  if (
    error instanceof ApiError &&
    error.kind === "VALIDATION_ERROR" &&
    error.httpStatus < 500
  ) {
    return "주문 내용을 다시 확인해 주세요. 문제가 계속되면 장바구니와 배송지를 확인해 주세요."
  }

  return "주문 진행 여부를 확인하지 못했습니다. 다시 시도하기 전에 주문 내역을 확인해 주세요."
}

function isUnauthorizedResult(result: PromiseSettledResult<unknown>) {
  return (
    result.status === "rejected" &&
    result.reason instanceof ApiError &&
    result.reason.kind === "UNAUTHORIZED"
  )
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
