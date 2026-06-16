import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

import { AdminAuthGuard } from "../../../admin-auth-guard"
import { AdminPageShell } from "../../../admin-page-shell"
import { ProductAdminForm } from "../../product-admin-form"

type AdminProductEditPageProps = {
  params: Promise<{
    productId: string
  }>
}

export default async function AdminProductEditPage({
  params,
}: AdminProductEditPageProps) {
  const { productId } = await params

  return (
    <AdminPageShell
      eyebrow="Admin / Products"
      title="상품 수정"
      description="상품 상세 정보를 불러온 뒤 관리자 상품 수정 API로 변경 사항을 저장합니다."
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
        <ProductAdminForm mode="edit" productId={productId} />
      </AdminAuthGuard>
    </AdminPageShell>
  )
}
