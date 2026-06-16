"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ShieldAlert, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { getAdminMembers } from "@/lib/api/admin"
import { getMe } from "@/lib/api/auth"
import {
  clearStoredAuthTokens,
  getStoredAuthTokens,
} from "@/lib/api/auth-token-storage"

type AdminAuthStatus = "checking" | "guest" | "denied" | "ready"

type AdminAuthGuardProps = {
  children: ReactNode
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [status, setStatus] = useState<AdminAuthStatus>("checking")

  useEffect(() => {
    let isActive = true

    async function checkAdmin() {
      if (!getStoredAuthTokens()) {
        if (isActive) {
          setStatus("guest")
        }
        return
      }

      try {
        const member = await getMe()

        if (!isActive) {
          return
        }

        if (member.role === "ADMIN") {
          setStatus("ready")
          return
        }

        if (member.role) {
          setStatus("denied")
          return
        }

        try {
          await getAdminMembers({ page: 0, size: 1 })
          setStatus("ready")
        } catch {
          setStatus("denied")
        }
      } catch {
        clearStoredAuthTokens()

        if (isActive) {
          setStatus("guest")
        }
      }
    }

    void checkAdmin()

    return () => {
      isActive = false
    }
  }, [])

  if (status === "checking") {
    return (
      <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
        관리자 권한을 확인하고 있습니다.
      </section>
    )
  }

  if (status === "guest") {
    return (
      <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
          <ShieldAlert className="size-6 text-neutral-500" />
        </div>
        <h2 className="mt-5 text-2xl font-bold">로그인이 필요합니다</h2>
        <p className="mt-3 text-sm text-neutral-600">
          관리자 화면은 관리자 계정으로 로그인한 뒤 이용할 수 있습니다.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/login?redirect=/admin">로그인하기</Link>
        </Button>
      </section>
    )
  }

  if (status === "denied") {
    return (
      <section className="rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50">
          <ShieldAlert className="size-6 text-red-600" />
        </div>
        <h2 className="mt-5 text-2xl font-bold">접근 권한이 없습니다</h2>
        <p className="mt-3 text-sm text-neutral-600">
          관리자 권한이 있는 계정으로 다시 로그인해 주세요.
        </p>
        <Button className="mt-6" variant="outline" asChild>
          <Link href="/">메인으로 이동</Link>
        </Button>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
        <ShieldCheck className="size-5 text-neutral-500" />
        관리자 API 요청은 현재 로그인된 access token으로 전송됩니다.
      </div>
      {children}
    </div>
  )
}
