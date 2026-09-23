"use client"

import Link from "next/link"
import Script from "next/script"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Home,
  LoaderCircle,
  ReceiptText,
  ShieldCheck,
} from "lucide-react"
import {
  type MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import { getStoredAuthTokens } from "@/lib/api/auth-token-storage"

type PaymentConfirmViewProps = {
  orderId: number | null
  tossOrderId: string | null
  amount: number | null
  tossWidgetClientKey: string | null
}

type TossAmount = {
  currency: "KRW"
  value: number
}

type TossWidgetInstance = {
  destroy: () => void
}

type TossPaymentWidgets = {
  setAmount: (amount: TossAmount) => Promise<void>
  renderPaymentMethods: (params: {
    selector: string
    variantKey?: string
  }) => Promise<TossWidgetInstance>
  renderAgreement: (params: {
    selector: string
    variantKey?: string
  }) => Promise<TossWidgetInstance>
  requestPayment: (params: {
    orderId: string
    orderName: string
    successUrl: string
    failUrl: string
  }) => Promise<void>
}

type TossPayments = {
  widgets: (params: { customerKey: string }) => TossPaymentWidgets
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPayments
  }
}

const TOSS_SDK_URL = "https://js.tosspayments.com/v2/standard"
const CUSTOMER_KEY_STORAGE_KEY = "coffeeprod:toss-customer-key"

export function PaymentConfirmView({
  orderId,
  tossOrderId,
  amount,
  tossWidgetClientKey,
}: PaymentConfirmViewProps) {
  const router = useRouter()
  const [sdkReady, setSdkReady] = useState(false)
  const [widgetReady, setWidgetReady] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const widgetsRef = useRef<TossPaymentWidgets | null>(null)
  const paymentMethodsRef = useRef<TossWidgetInstance | null>(null)
  const agreementRef = useRef<TossWidgetInstance | null>(null)
  const hasOrder = orderId !== null && tossOrderId !== null && amount !== null
  const orderName = useMemo(() => {
    if (orderId === null) {
      return "CoffeeProd 주문"
    }

    return `CoffeeProd 주문 #${orderId}`
  }, [orderId])

  useEffect(() => {
    if (!sdkReady || !hasOrder || amount === null) {
      return
    }

    let canceled = false

    async function renderWidget() {
      destroyWidget(paymentMethodsRef)
      destroyWidget(agreementRef)
      setWidgetReady(false)
      setMessage(null)

      if (!window.TossPayments) {
        setMessage("결제수단을 불러오지 못했습니다. 페이지를 새로고침해 주세요.")
        return
      }

      if (!tossWidgetClientKey) {
        setMessage(
          "현재 결제를 이용할 수 없습니다. 잠시 후 주문 내역에서 다시 시도해 주세요."
        )
        return
      }

      try {
        const tossPayments = window.TossPayments(tossWidgetClientKey)
        const widgets = tossPayments.widgets({
          customerKey: getOrCreateCustomerKey(),
        })

        if (amount === null) return

        widgetsRef.current = widgets
        await widgets.setAmount({ currency: "KRW", value: amount })

        const [paymentMethodsWidget, agreementWidget] = await Promise.all([
          widgets.renderPaymentMethods({
            selector: "#toss-payment-methods",
            variantKey: "DEFAULT",
          }),
          widgets.renderAgreement({
            selector: "#toss-payment-agreement",
            variantKey: "AGREEMENT",
          }),
        ])

        if (canceled) {
          paymentMethodsWidget.destroy()
          agreementWidget.destroy()
          return
        }

        paymentMethodsRef.current = paymentMethodsWidget
        agreementRef.current = agreementWidget
        setWidgetReady(true)
      } catch {
        setMessage(
          "결제수단을 준비하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요."
        )
      }
    }

    void renderWidget()

    return () => {
      canceled = true
      destroyWidget(paymentMethodsRef)
      destroyWidget(agreementRef)
    }
  }, [amount, hasOrder, sdkReady, tossWidgetClientKey])

  async function handlePaymentRequest() {
    if (orderId === null || tossOrderId === null || amount === null) {
      setMessage("결제 요청에 필요한 주문 정보가 없습니다.")
      return
    }

    if (!getStoredAuthTokens()) {
      router.push(
        `/login?redirect=${encodeURIComponent(
          `/checkout/payment?orderId=${orderId}&tossOrderId=${tossOrderId}&amount=${amount}`
        )}`
      )
      return
    }

    if (!widgetsRef.current || !widgetReady) {
      setMessage("결제수단을 준비하고 있습니다. 잠시 후 다시 시도해 주세요.")
      return
    }

    setIsRequesting(true)
    setMessage(null)

    try {
      await widgetsRef.current.requestPayment({
        orderId: tossOrderId,
        orderName,
        successUrl: `${window.location.origin}/checkout/payment/success`,
        failUrl: `${window.location.origin}/checkout/payment/fail?internalOrderId=${orderId}&amount=${amount}`,
      })
    } catch (error) {
      setMessage(getTossErrorMessage(error))
      setIsRequesting(false)
    }
  }

  return (
    <main className="order-page min-h-screen bg-neutral-50 text-neutral-950">
      <Script
        src={TOSS_SDK_URL}
        strategy="afterInteractive"
        onReady={() => setSdkReady(true)}
        onError={() => setMessage("결제수단을 불러오지 못했습니다. 페이지를 새로고침해 주세요.")}
      />

      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Home className="size-5" />
            CoffeeProd
          </Link>

          <Button variant="outline" asChild>
            <Link href={orderId === null ? "/orders" : `/orders/${orderId}`}>
              <ArrowLeft data-icon="inline-start" />
              주문 상세
            </Link>
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="flex flex-col gap-6">
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-neutral-500">
                Toss Payments
              </p>
              <h1 className="mt-2 text-3xl font-bold">결제하기</h1>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                결제 금액을 확인하고 결제수단을 선택해 주세요.
              </p>
            </div>

            <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">결제수단</h2>
                {!widgetReady && hasOrder && (
                  <span className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                    <LoaderCircle className="size-4 animate-spin" />
                    결제수단 준비 중
                  </span>
                )}
              </div>

              {hasOrder ? (
                <div
                  id="toss-payment-methods"
                  className="mt-4 min-h-72 overflow-hidden rounded-lg border border-neutral-100"
                />
              ) : (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  결제 준비에 필요한 주문 정보가 없습니다.
                </div>
              )}
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">약관</h2>
              {hasOrder ? (
                <div id="toss-payment-agreement" className="mt-4" />
              ) : (
                <p className="mt-4 text-sm text-neutral-500">
                  주문 정보가 확인되면 약관 영역이 표시됩니다.
                </p>
              )}
            </section>
          </section>

          <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">결제 요약</h2>

            {hasOrder ? (
              <dl className="mt-5 flex flex-col gap-3 border-y border-neutral-200 py-4 text-sm">
                <SummaryRow label="주문 번호" value={String(orderId)} />
                <SummaryRow
                  label="결제 금액"
                  value={`${amount.toLocaleString()}원`}
                />
              </dl>
            ) : (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                결제 준비에 필요한 주문 정보가 없습니다.
              </div>
            )}

            {message && (
              <p
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                role="alert"
              >
                {message}
              </p>
            )}

            <Button
              type="button"
              className="mt-5 w-full"
              disabled={!hasOrder || !widgetReady || isRequesting}
              onClick={handlePaymentRequest}
            >
              {isRequesting ? (
                <LoaderCircle data-icon="inline-start" className="animate-spin" />
              ) : (
                <ReceiptText data-icon="inline-start" />
              )}
              {isRequesting ? "결제창 이동 중" : "결제하기"}
            </Button>

            <div className="mt-5 flex items-start gap-2 rounded-lg bg-neutral-50 p-3 text-xs leading-5 text-neutral-600">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              결제가 완료되면 결과를 안내합니다. 결제를 중단한 주문은
              주문 내역에서 다시 결제하거나 취소할 수 있습니다.
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function SummaryRow({
  label,
  value,
  truncate,
}: {
  label: string
  value: string
  truncate?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd
        className={
          truncate
            ? "max-w-44 truncate text-right font-semibold text-neutral-950"
            : "text-right font-semibold text-neutral-950"
        }
      >
        {value}
      </dd>
    </div>
  )
}

function destroyWidget(ref: MutableRefObject<TossWidgetInstance | null>) {
  ref.current?.destroy()
  ref.current = null
}

function getOrCreateCustomerKey() {
  const storedKey = window.localStorage.getItem(CUSTOMER_KEY_STORAGE_KEY)

  if (storedKey) {
    return storedKey
  }

  const randomValue =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`
  const customerKey = `coffeeprod_${randomValue}`

  window.localStorage.setItem(CUSTOMER_KEY_STORAGE_KEY, customerKey)
  return customerKey
}

function getTossErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "결제 요청을 처리하지 못했습니다."
  }

  const maybeError = error as { code?: string; message?: string }

  if (maybeError.code === "USER_CANCEL") {
    return "결제가 취소되었습니다. 결제수단을 확인한 뒤 다시 시도해 주세요."
  }

  return maybeError.message ?? "결제 요청을 처리하지 못했습니다."
}
