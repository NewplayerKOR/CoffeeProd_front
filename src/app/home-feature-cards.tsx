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
    icon: Sparkles,
  },
  {
    href: "/products",
    title: "상품 둘러보기",
    icon: Coffee,
  },
  {
    href: "/cart",
    title: "장바구니",
    icon: ShoppingCart,
  },
  {
    href: "/me/addresses",
    title: "배송지 관리",
    icon: MapPin,
  },
  {
    href: "/orders",
    title: "주문 내역",
    icon: ReceiptText,
  },
  {
    href: "/me",
    title: "마이페이지",
    icon: UserRound,
  },
]

const adminFeatureLink = {
  href: "/admin",
  title: "관리자",
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

  const links = isAdmin
    ? [...userFeatureLinks, adminFeatureLink]
    : userFeatureLinks

  return (
    <section className="home-member-section" aria-labelledby="member-menu-title">
      <div className="home-section-heading">
        <div>
          <p className="editorial-kicker">For members</p>
          <h2 id="member-menu-title">나의 CoffeeProd</h2>
        </div>
        <p>저장한 취향부터 배송과 주문까지 빠르게 이어갑니다.</p>
      </div>
      <nav className="home-member-links" aria-label="회원 바로가기">
        {links.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className="home-member-link"
            >
              <Icon />
              <span>{item.title}</span>
              <ArrowRight className="home-member-arrow" />
            </Link>
          )
        })}
      </nav>
    </section>
  )
}
