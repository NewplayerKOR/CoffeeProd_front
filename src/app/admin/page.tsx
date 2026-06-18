import Link from "next/link"
import {
  BarChart3,
  Boxes,
  FolderTree,
  MessageCircle,
  Plus,
  ReceiptText,
  Settings,
  UsersRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import { AdminAuthGuard } from "./admin-auth-guard"
import { AdminPageShell } from "./admin-page-shell"

const adminLinks = [
  {
    href: "/admin/products",
    title: "상품 관리",
    description: "상품 목록에서 판매 상태와 재고 추가 작업을 처리합니다.",
    icon: Boxes,
  },
  {
    href: "/admin/products/new",
    title: "상품 등록",
    description: "카테고리, 가격, 재고, 로스팅 정보로 새 상품을 등록합니다.",
    icon: Plus,
  },
  {
    href: "/admin/categories",
    title: "카테고리 관리",
    description: "상품 카테고리를 생성하거나 이름을 수정합니다.",
    icon: FolderTree,
  },
  {
    href: "/admin/members",
    title: "회원 관리",
    description: "회원 목록을 확인하고 등급과 계정 상태를 변경합니다.",
    icon: UsersRound,
  },
  {
    href: "/admin/orders",
    title: "주문 관리",
    description: "전체 주문 상태를 변경하고 배송 운송장을 등록합니다.",
    icon: ReceiptText,
  },
  {
    href: "/admin/qnas",
    title: "상품 문의 관리",
    description: "답변 대기 상품 문의를 확인하고 관리자 답변을 등록합니다.",
    icon: MessageCircle,
  },
  {
    href: "/admin/statistics",
    title: "매출 통계",
    description: "일·월·연도별 주문 매출을 조회하고 일자별 통계를 재집계합니다.",
    icon: BarChart3,
  },
]

export default function AdminPage() {
  return (
    <AdminPageShell
      title="관리자 콘솔"
      description="상품, 카테고리, 회원, 주문, 고객 문의와 매출 통계를 관리합니다."
    >
      <AdminAuthGuard>
        <section className="grid gap-4 md:grid-cols-3">
          {adminLinks.map((item) => {
            const Icon = item.icon

            return (
              <article
                key={item.href}
                className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="flex size-11 items-center justify-center rounded-lg bg-neutral-100">
                  <Icon className="size-5 text-neutral-600" />
                </div>
                <h2 className="mt-5 text-lg font-bold">{item.title}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-neutral-600">
                  {item.description}
                </p>
                <Button className="mt-5 w-full justify-start" asChild>
                  <Link href={item.href}>
                    <Settings data-icon="inline-start" />
                    이동
                  </Link>
                </Button>
              </article>
            )
          })}
        </section>
      </AdminAuthGuard>
    </AdminPageShell>
  )
}
