"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { RotateCw } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { getAdminMembers } from "@/lib/api/admin"
import { getMe } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/types"
import {
  clearStoredAuthTokens,
  getStoredAuthTokens,
} from "@/lib/api/auth-token-storage"

type AdminAuthStatus = "checking" | "guest" | "denied" | "error" | "ready"

type AdminAuthGuardProps = {
  children: ReactNode
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [status, setStatus] = useState<AdminAuthStatus>("checking")
  const [retryCount, setRetryCount] = useState(0)

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
        } catch (error) {
          if (!isActive) return
          if (error instanceof ApiError && error.kind === "UNAUTHORIZED") {
            clearStoredAuthTokens()
            setStatus("guest")
          } else if (error instanceof ApiError && error.kind === "FORBIDDEN") {
            setStatus("denied")
          } else {
            setStatus("error")
          }
        }
      } catch (error) {
        if (!isActive) return
        if (error instanceof ApiError && error.kind === "UNAUTHORIZED") {
          clearStoredAuthTokens()
          setStatus("guest")
        } else if (error instanceof ApiError && error.kind === "FORBIDDEN") {
          setStatus("denied")
        } else {
          setStatus("error")
        }
      }
    }

    void checkAdmin()

    return () => {
      isActive = false
    }
  }, [retryCount])

  if (status === "checking") {
    return (
      <section className="max-w-xl border-t border-neutral-200 pt-7 text-sm text-neutral-600" aria-live="polite">
        관리자 권한을 확인하고 있습니다.
      </section>
    )
  }

  if (status === "guest") {
    return (
      <section className="max-w-xl border-t border-neutral-200 pt-7">
        <h2 className="text-2xl font-bold">로그인이 필요합니다</h2>
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
      <section className="max-w-xl border-t border-red-300 pt-7">
        <h2 className="text-2xl font-bold">접근 권한이 없습니다</h2>
        <p className="mt-3 text-sm text-neutral-600">
          관리자 권한이 있는 계정으로 다시 로그인해 주세요.
        </p>
        <Button className="mt-6" variant="outline" asChild>
          <Link href="/">메인으로 이동</Link>
        </Button>
      </section>
    )
  }

  if (status === "error") {
    return (
      <section className="max-w-xl border-t border-red-300 pt-7" role="alert">
        <h2 className="text-2xl font-bold">권한을 확인하지 못했습니다</h2>
        <p className="mt-3 text-sm text-neutral-600">연결을 확인한 뒤 다시 시도해 주세요. 로그인 상태는 유지됩니다.</p>
        <Button type="button" variant="outline" className="mt-6" onClick={() => { setStatus("checking"); setRetryCount((value) => value + 1) }}>
          <RotateCw data-icon="inline-start" /> 다시 시도
        </Button>
      </section>
    )
  }

  return <>{children}</>
}
