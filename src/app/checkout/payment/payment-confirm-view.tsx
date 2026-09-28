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

type WidgetLoadState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; reason: "sdk" | "config" | "widget" }

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPayments
  }
}

const TOSS_SDK_URL = "https://js.tosspayments.com/v2/standard"
const CUSTOMER_KEY_STORAGE_KEY = "coffeeprod:toss-customer-key"
const WIDGET_PREPARATION_TIMEOUT_MS = 60_000

export function PaymentConfirmView({
  orderId,
  tossOrderId,
  amount,
  tossWidgetClientKey,
}: PaymentConfirmViewProps) {
  const router = useRouter()
  const [sdkStatus, setSdkStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  )
  const [widgetLoad, setWidgetLoad] = useState<WidgetLoadState>({
    status: "loading",
  })
  const [widgetAttempt, setWidgetAttempt] = useState(0)
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestMessage, setRequestMessage] = useState<string | null>(null)
  const widgetsRef = useRef<TossPaymentWidgets | null>(null)
  const paymentMethodsRef = useRef<TossWidgetInstance | null>(null)
  const agreementRef = useRef<TossWidgetInstance | null>(null)
  const hasOrder = orderId !== null && tossOrderId !== null && amount !== null
  const currentWidgetLoad: WidgetLoadState = !tossWidgetClientKey
    ? { status: "error", reason: "config" }
    : sdkStatus === "error"
      ? { status: "error", reason: "sdk" }
      : widgetLoad
  const orderName = useMemo(() => {
    if (orderId === null) {
      return "CoffeeProd 주문"
    }

    return `CoffeeProd 주문 #${orderId}`
  }, [orderId])

  useEffect(() => {
    if (!hasOrder || !tossWidgetClientKey || sdkStatus !== "loading") return

    const timeoutId = window.setTimeout(() => {
      setSdkStatus("error")
    }, WIDGET_PREPARATION_TIMEOUT_MS)

    return () => window.clearTimeout(timeoutId)
  }, [hasOrder, sdkStatus, tossWidgetClientKey])

  useEffect(() => {
    if (!hasOrder || amount === null) {
      return
    }

    if (!tossWidgetClientKey || sdkStatus !== "ready") {
      return
    }

    const widgetClientKey = tossWidgetClientKey
    const widgetAmount = amount
    let canceled = false
    const timeoutId = window.setTimeout(() => {
      canceled = true
      destroyWidget(paymentMethodsRef)
      destroyWidget(agreementRef)
      widgetsRef.current = null
      setWidgetLoad({ status: "error", reason: "widget" })
    }, WIDGET_PREPARATION_TIMEOUT_MS)

    async function renderWidget() {
      setWidgetLoad({ status: "loading" })
      destroyWidget(paymentMethodsRef)
      destroyWidget(agreementRef)
      widgetsRef.current = null

      if (!window.TossPayments) {
        window.clearTimeout(timeoutId)
        setWidgetLoad({ status: "error", reason: "sdk" })
        return
      }

      try {
        const tossPayments = window.TossPayments(widgetClientKey)
        const widgets = tossPayments.widgets({
          customerKey: getOrCreateCustomerKey(),
        })

        widgetsRef.current = widgets
        await widgets.setAmount({ currency: "KRW", value: widgetAmount })
        if (canceled) return

        const paymentMethodsWidget = await widgets.renderPaymentMethods({
          selector: "#toss-payment-methods",
          variantKey: "DEFAULT",
        })

        if (canceled) {
          paymentMethodsWidget.destroy()
          return
        }

        paymentMethodsRef.current = paymentMethodsWidget
        const agreementWidget = await widgets.renderAgreement({
          selector: "#toss-payment-agreement",
          variantKey: "AGREEMENT",
        })

        if (canceled) {
          agreementWidget.destroy()
          return
        }

        agreementRef.current = agreementWidget
        window.clearTimeout(timeoutId)
        setWidgetLoad({ status: "ready" })
      } catch {
        if (canceled) return
        window.clearTimeout(timeoutId)
        destroyWidget(paymentMethodsRef)
        destroyWidget(agreementRef)
        widgetsRef.current = null
        setWidgetLoad({ status: "error", reason: "widget" })
      }
    }

    void renderWidget()

    return () => {
      canceled = true
      window.clearTimeout(timeoutId)
      destroyWidget(paymentMethodsRef)
      destroyWidget(agreementRef)
      widgetsRef.current = null
    }
  }, [amount, hasOrder, sdkStatus, tossWidgetClientKey, widgetAttempt])

  function handleWidgetRetry() {
    if (currentWidgetLoad.status !== "error") return

    if (currentWidgetLoad.reason !== "widget" || widgetAttempt > 0) {
      window.location.reload()
      return
    }

    setRequestMessage(null)
    setWidgetLoad({ status: "loading" })
    setWidgetAttempt((attempt) => attempt + 1)
  }

  async function handlePaymentRequest() {
    if (orderId === null || tossOrderId === null || amount === null) {
      setRequestMessage("결제 요청에 필요한 주문 정보가 없습니다.")
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

    if (!widgetsRef.current || currentWidgetLoad.status !== "ready") {
      setRequestMessage("결제수단을 준비하고 있습니다. 잠시 후 다시 시도해 주세요.")
      return
    }

    setIsRequesting(true)
    setRequestMessage(null)

    try {
      await widgetsRef.current.requestPayment({
        orderId: tossOrderId,
        orderName,
        successUrl: `${window.location.origin}/checkout/payment/success`,
        failUrl: `${window.location.origin}/checkout/payment/fail?internalOrderId=${orderId}&amount=${amount}`,
      })
    } catch (error) {
      setRequestMessage(getTossErrorMessage(error))
      setIsRequesting(false)
    }
  }

  return (
    <main className="order-page min-h-screen bg-neutral-50 text-neutral-950">
      <Script
        src={TOSS_SDK_URL}
        strategy="afterInteractive"
        onReady={() =>
          setSdkStatus((status) => (status === "error" ? status : "ready"))
        }
        onError={() => setSdkStatus("error")}
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
                {currentWidgetLoad.status === "loading" && hasOrder && (
                  <span
                    className="flex items-center gap-2 text-sm font-medium text-neutral-500"
                    role="status"
                  >
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    결제수단 준비 중
                  </span>
                )}
              </div>

              {hasOrder && currentWidgetLoad.status === "error" ? (
                <div
                  key="widget-error"
                  className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  role="alert"
                >
                  <p>{getWidgetErrorMessage(currentWidgetLoad.reason)}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={handleWidgetRetry}
                  >
                    다시 시도
                  </Button>
                </div>
              ) : hasOrder ? (
                <div
                  key="widget-container"
                  id="toss-payment-methods"
                  className="mt-4 min-h-72 overflow-hidden rounded-lg border border-neutral-100"
                />
              ) : (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  결제 준비에 필요한 주문 정보가 없습니다.
                </div>
              )}
            </section>

            {(currentWidgetLoad.status !== "error" || !hasOrder) && (
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
            )}
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

            {requestMessage && (
              <p
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                role="alert"
              >
                {requestMessage}
              </p>
            )}

            <Button
              type="button"
              className="mt-5 w-full"
              disabled={!hasOrder || currentWidgetLoad.status !== "ready" || isRequesting}
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

function getWidgetErrorMessage(reason: "sdk" | "config" | "widget") {
  if (reason === "config") {
    return "현재 결제수단을 이용할 수 없습니다. 잠시 후 다시 시도해 주세요."
  }

  return "결제수단을 불러오지 못했습니다. 다시 시도해 주세요."
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
    return "결제 요청 결과를 확인하지 못했습니다. 주문 내역에서 상태를 확인해 주세요."
  }

  const maybeError = error as { code?: string }

  if (maybeError.code === "USER_CANCEL") {
    return "결제가 취소되었습니다. 결제수단을 확인한 뒤 다시 시도해 주세요."
  }

  return "결제 요청 결과를 확인하지 못했습니다. 주문 내역에서 상태를 확인해 주세요."
}
