import type { Metadata } from "next"
import { OrderDetailView } from "./order-detail-view"

type OrderDetailPageProps = {
  params: Promise<{
    orderId: string
  }>
}

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }): Promise<Metadata> {
  const { orderId } = await params
  return { title: /^[1-9]\d*$/.test(orderId) ? `주문 상세 #${orderId}` : "주문 상세" }
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { orderId } = await params

  return <OrderDetailView orderId={orderId} />
}
