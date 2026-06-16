import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

import { AdminAuthGuard } from "../admin-auth-guard"
import { AdminPageShell } from "../admin-page-shell"
import { ProductsAdminView } from "./products-admin-view"

export default function AdminProductsPage() {
  return (
    <AdminPageShell
      eyebrow="Admin / Products"
      title="상품 관리"
      description="공개 상품 목록을 기준으로 상품 수정, 판매 상태 변경, 재고 추가 작업을 수행합니다."
      actions={
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus data-icon="inline-start" />
            상품 등록
          </Link>
        </Button>
      }
    >
      <AdminAuthGuard>
        <ProductsAdminView />
      </AdminAuthGuard>
    </AdminPageShell>
  )
}
