"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, UserRound } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { getMe, logout, type Member } from "@/lib/api/auth"
import {
  clearStoredAuthTokens,
  getStoredAuthTokens,
} from "@/lib/api/auth-token-storage"
import { AUTH_EXPIRED_EVENT } from "@/lib/api/client"

type AuthStatus = "checking" | "guest" | "authenticated"

export function HomeAuthActions() {
  const router = useRouter()
  const [status, setStatus] = useState<AuthStatus>("checking")
  const [member, setMember] = useState<Member | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let isActive = true

    async function syncAuthState() {
      const tokens = getStoredAuthTokens()

      if (!tokens) {
        if (isActive) {
          setMember(null)
          setStatus("guest")
        }
        return
      }

      try {
        const currentMember = await getMe()

        if (isActive) {
          setMember(currentMember)
          setStatus("authenticated")
        }
      } catch {
        clearStoredAuthTokens()

        if (isActive) {
          setMember(null)
          setStatus("guest")
        }
      }
    }

    function handleAuthExpired() {
      setMember(null)
      setStatus("guest")
    }

    void syncAuthState()
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)

    return () => {
      isActive = false
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
    }
  }, [])

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logout()
    } catch {
      // 로그아웃 API 실패 여부와 무관하게 프론트 토큰은 제거합니다.
    } finally {
      clearStoredAuthTokens()
      setMember(null)
      setStatus("guest")
      setIsLoggingOut(false)
      router.refresh()
      window.location.reload()
    }
  }

  if (status === "checking") {
    return (
      <Button variant="outline" disabled>
        인증 확인 중
      </Button>
    )
  }

  if (status === "authenticated" && member) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700">
          <UserRound className="size-4" />
          {member.nickname}님
        </span>
        <Button variant="outline" asChild>
          <Link href="/me">
            <UserRound data-icon="inline-start" />
            마이페이지
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isLoggingOut}
          onClick={handleLogout}
        >
          <LogOut data-icon="inline-start" />
          {isLoggingOut ? "로그아웃 중" : "로그아웃"}
        </Button>
      </div>
    )
  }

  return (
    <Button variant="outline" asChild>
      <Link href="/login">로그인</Link>
    </Button>
  )
}
