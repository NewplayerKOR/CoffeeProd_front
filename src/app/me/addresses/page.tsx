import type { Metadata } from "next"
import { AddressManager } from "./address-manager"

export const metadata: Metadata = { title: "배송지 관리" }

export default function AddressesPage() {
  return <AddressManager />
}
