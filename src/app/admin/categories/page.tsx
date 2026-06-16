import { AdminAuthGuard } from "../admin-auth-guard"
import { AdminPageShell } from "../admin-page-shell"
import { AdminCategoriesView } from "./categories-admin-view"

export default function AdminCategoriesPage() {
  return (
    <AdminPageShell
      eyebrow="Admin / Categories"
      title="카테고리 관리"
      description="공개 카테고리 목록을 기준으로 새 카테고리를 생성하고 기존 카테고리명을 수정합니다."
    >
      <AdminAuthGuard>
        <AdminCategoriesView />
      </AdminAuthGuard>
    </AdminPageShell>
  )
}
