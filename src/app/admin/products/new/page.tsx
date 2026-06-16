import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { AdminAuthGuard } from "../../admin-auth-guard"
import { AdminPageShell } from "../../admin-page-shell"
import { ProductAdminForm } from "../product-admin-form"

export default function AdminProductNewPage() {
  return (
    <AdminPageShell
      eyebrow="Admin / Products"
      title="상품 등록"
      description="관리자 상품 등록 API에 맞춰 image_url 필드를 포함한 상품 정보를 저장합니다."
      actions={
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <ArrowLeft data-icon="inline-start" />
            상품 목록
          </Link>
        </Button>
      }
    >
      <AdminAuthGuard>
        <ProductAdminForm mode="create" />
      </AdminAuthGuard>
    </AdminPageShell>
  )
}
