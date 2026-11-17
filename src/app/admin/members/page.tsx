import type { Metadata } from "next"
import { AdminAuthGuard } from "../admin-auth-guard"
import { AdminPageShell } from "../admin-page-shell"
import { MembersAdminView } from "./members-admin-view"

export const metadata: Metadata = { title: "회원 관리" }

export default function AdminMembersPage() {
  return (
    <AdminPageShell
      eyebrow="관리자 / 회원"
      title="회원 관리"
      description="회원 목록을 조회하고 등급과 활성 상태를 변경합니다. 탈퇴 회원은 상태 변경 대상에서 제외됩니다."
    >
      <AdminAuthGuard>
        <MembersAdminView />
      </AdminAuthGuard>
    </AdminPageShell>
  )
}
