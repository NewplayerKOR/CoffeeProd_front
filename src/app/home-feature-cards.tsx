"use client"

import Link from "next/link"
import {
  ArrowRight,
  Coffee,
  MapPin,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  UserRound,
} from "lucide-react"
import { useEffect, useState } from "react"

import { getAdminMembers } from "@/lib/api/admin"
import { getMe, type Member } from "@/lib/api/auth"
import {
  clearStoredAuthTokens,
  getStoredAuthTokens,
} from "@/lib/api/auth-token-storage"

const userFeatureLinks = [
  {
    href: "/recommendations",
    title: "취향 추천",
    description: "로스팅과 향미 취향에 맞는 커피 상품을 추천받습니다.",
    icon: Sparkles,
  },
  {
    href: "/products",
    title: "상품 둘러보기",
    description: "카테고리, 로스팅, 검색, 정렬 조건으로 원두를 찾습니다.",
    icon: Coffee,
  },
  {
    href: "/cart",
    title: "장바구니",
    description: "담은 상품의 분쇄 옵션과 수량을 조정하고 주문으로 이동합니다.",
    icon: ShoppingCart,
  },
  {
    href: "/me/addresses",
    title: "배송지 관리",
    description: "주문에 사용할 배송지를 등록하고 기본 배송지를 설정합니다.",
    icon: MapPin,
  },
  {
    href: "/orders",
    title: "주문 내역",
    description: "주문 상태, 결제 대기, 배송 정보와 취소 가능 여부를 확인합니다.",
    icon: ReceiptText,
  },
  {
    href: "/me",
    title: "마이페이지",
    description: "내 정보, 비밀번호, 회원 탈퇴와 개인 메뉴를 관리합니다.",
    icon: UserRound,
  },
]

const adminFeatureLink = {
  href: "/admin",
  title: "관리자",
  description: "상품, 카테고리, 회원, 주문 운영 화면으로 이동합니다.",
  icon: ShieldCheck,
}

export function HomeFeatureCards() {
  const [member, setMember] = useState<Member | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadMember() {
      if (!getStoredAuthTokens()) {
        if (isActive) {
          setIsChecking(false)
        }
        return
      }

      try {
        const currentMember = await getMe()

        let hasAdminAccess = currentMember.role === "ADMIN"

        if (!currentMember.role) {
          try {
            await getAdminMembers({ page: 0, size: 1 })
            hasAdminAccess = true
          } catch {
            hasAdminAccess = false
          }
        }

        if (isActive) {
          setMember(currentMember)
          setIsAdmin(hasAdminAccess)
        }
      } catch {
        clearStoredAuthTokens()
      } finally {
        if (isActive) {
          setIsChecking(false)
        }
      }
    }

    void loadMember()

    return () => {
      isActive = false
    }
  }, [])

  if (isChecking || !member) {
    return null
  }

  const links =
    isAdmin
      ? [...userFeatureLinks, adminFeatureLink]
      : userFeatureLinks

  return (
    <section className="grid grid-cols-3 gap-2 pb-8 md:gap-4 md:pb-10">
      {links.map((item) => {
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className="group flex min-h-28 flex-col rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-colors hover:border-neutral-950 md:min-h-0 md:p-5"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-neutral-100 md:size-11">
              <Icon className="size-4 text-neutral-600 md:size-5" />
            </div>
            <h2 className="mt-3 text-[13px] font-bold leading-5 md:mt-5 md:text-lg">
              {item.title}
            </h2>
            <p className="mt-2 hidden min-h-12 text-sm leading-6 text-neutral-600 md:block">
              {item.description}
            </p>
            <span className="mt-auto hidden items-center gap-1 pt-5 text-sm font-medium text-neutral-500 group-hover:text-neutral-950 md:flex">
              이동
              <ArrowRight className="size-4" />
            </span>
          </Link>
        )
      })}
    </section>
  )
}
