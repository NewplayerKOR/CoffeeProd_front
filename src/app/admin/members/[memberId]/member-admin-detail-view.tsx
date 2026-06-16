"use client"

import { UserRound } from "lucide-react"
import { useEffect, useState } from "react"

import { getAdminMember } from "@/lib/api/admin"
import { type Member } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/types"

type MemberAdminDetailViewProps = {
  memberId: string
}

export function MemberAdminDetailView({ memberId }: MemberAdminDetailViewProps) {
  const [member, setMember] = useState<Member | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadMember() {
      setIsLoading(true)
      setMessage(null)

      try {
        const nextMember = await getAdminMember(memberId)

        if (isActive) {
          setMember(nextMember)
        }
      } catch (error) {
        if (isActive) {
          setMessage(getAdminErrorMessage(error))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadMember()

    return () => {
      isActive = false
    }
  }, [memberId])

  if (isLoading) {
    return (
      <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
        회원 정보를 불러오고 있습니다.
      </section>
    )
  }

  if (!member) {
    return (
      <section className="rounded-lg border border-red-200 bg-white p-8 text-center text-sm font-medium text-red-700 shadow-sm">
        {message ?? "회원 정보를 불러오지 못했습니다."}
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100">
          <UserRound className="size-6 text-neutral-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{member.nickname}</h2>
          <p className="mt-1 text-sm text-neutral-500">{member.email}</p>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 md:grid-cols-2">
        <DetailItem label="회원 ID" value={String(member.id)} />
        <DetailItem label="이름" value={member.name} />
        <DetailItem label="역할" value={member.role ?? "USER"} />
        <DetailItem label="등급" value={member.grade} />
        <DetailItem label="상태" value={member.status} />
        <DetailItem label="마일리지" value={`${member.mileage.toLocaleString()}P`} />
      </dl>
    </section>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <dt className="text-sm font-medium text-neutral-500">{label}</dt>
      <dd className="mt-2 font-semibold text-neutral-950">{value}</dd>
    </div>
  )
}

function getAdminErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "관리자 요청을 처리하지 못했습니다."
}
