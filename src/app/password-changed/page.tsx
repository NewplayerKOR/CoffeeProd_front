import type { Metadata } from "next"
import { PasswordChangedRedirect } from "./password-changed-redirect"

export const metadata: Metadata = { title: "비밀번호 변경 완료" }

export default function PasswordChangedPage() {
  return <PasswordChangedRedirect />
}
