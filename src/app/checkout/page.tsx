import type { Metadata } from "next"
import { CheckoutView } from "./checkout-view"

export const metadata: Metadata = { title: "주문서 작성" }

export default function CheckoutPage() {
  return <CheckoutView />
}
