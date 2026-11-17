import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = { title: "소셜 로그인 확인" }

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
