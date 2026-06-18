import { AdminAuthGuard } from "../admin-auth-guard"
import { AdminPageShell } from "../admin-page-shell"
import { SalesStatisticsView } from "./sales-statistics-view"

export default function AdminStatisticsPage() {
  return (
    <AdminPageShell
      eyebrow="Admin / Statistics"
      title="매출 통계"
      description="결제 완료 시각을 기준으로 일·월·연도별 매출을 조회하고 특정 일자를 재집계합니다."
    >
      <AdminAuthGuard>
        <SalesStatisticsView />
      </AdminAuthGuard>
    </AdminPageShell>
  )
}
