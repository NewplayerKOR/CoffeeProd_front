import { AdminAuthGuard } from "../admin-auth-guard"
import { AdminPageShell } from "../admin-page-shell"
import { QnasAdminView } from "./qnas-admin-view"

export default function AdminQnasPage() {
  return (
    <AdminPageShell
      eyebrow="Admin / Q&A"
      title="상품 문의 관리"
      description="답변 대기 문의를 확인하고 고객에게 답변을 등록합니다."
    >
      <AdminAuthGuard>
        <QnasAdminView />
      </AdminAuthGuard>
    </AdminPageShell>
  )
}
