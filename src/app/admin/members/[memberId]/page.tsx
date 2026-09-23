import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

import { AdminAuthGuard } from "../../admin-auth-guard"
import { AdminPageShell } from "../../admin-page-shell"
import { MemberAdminDetailView } from "./member-admin-detail-view"

type AdminMemberDetailPageProps = {
  params: Promise<{
    memberId: string
  }>
}

export default async function AdminMemberDetailPage({
  params,
}: AdminMemberDetailPageProps) {
  const { memberId } = await params

  return (
    <AdminPageShell
      eyebrow="Admin / Members"
      title="회원 상세"
      description="회원 상세 정보를 확인하고 등급과 상태를 관리합니다."
      actions={
        <Button variant="outline" asChild>
          <Link href="/admin/members">
            <ArrowLeft data-icon="inline-start" />
            회원 목록
          </Link>
        </Button>
      }
    >
      <AdminAuthGuard>
        <MemberAdminDetailView memberId={memberId} />
      </AdminAuthGuard>
    </AdminPageShell>
  )
}
