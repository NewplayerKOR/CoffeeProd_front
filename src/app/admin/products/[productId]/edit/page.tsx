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
      eyebrow="관리자 / 상품"
      title="상품 수정"
      description="상품 정보를 확인하고 변경 사항을 저장합니다."
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
