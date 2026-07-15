import { AdminAuthGuard } from "../admin-auth-guard"
import { AdminPageShell } from "../admin-page-shell"
import { CoffeeCatalogAdminView } from "./coffee-catalog-admin-view"

export default function AdminCoffeeCatalogPage() {
  return (
    <AdminPageShell
      eyebrow="Admin / Coffee Catalog"
      title="커피 카탈로그 관리"
      description="상품에 연결할 커피 프로필과 가공 방식, 향미, 추출 방식, 품종 기준정보를 관리합니다."
    >
      <AdminAuthGuard>
        <CoffeeCatalogAdminView />
      </AdminAuthGuard>
    </AdminPageShell>
  )
}
