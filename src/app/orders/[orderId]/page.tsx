import { OrderDetailView } from "./order-detail-view"

type OrderDetailPageProps = {
  params: Promise<{
    orderId: string
  }>
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { orderId } = await params

  return <OrderDetailView orderId={orderId} />
}
