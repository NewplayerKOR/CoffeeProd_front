import { AdminAuthGuard } from "../admin-auth-guard"
import { AdminPageShell } from "../admin-page-shell"
import { OrdersAdminView } from "./orders-admin-view"

export default function AdminOrdersPage() {
  return (
    <AdminPageShell
      eyebrow="Admin / Orders"
      title="주문 관리"
      description="전체 주문을 조회하고 허용된 상태 전이 규칙에 따라 결제, 배송, 배송 완료 상태를 변경합니다."
    >
      <AdminAuthGuard>
        <OrdersAdminView />
      </AdminAuthGuard>
    </AdminPageShell>
  )
}
