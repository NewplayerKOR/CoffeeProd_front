"use client"

import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  UsersRound,
} from "lucide-react"
import { type ChangeEvent, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  updateAdminMemberGrade,
  updateAdminMemberStatus,
  getAdminMembers,
  type AdminMemberMutableStatus,
} from "@/lib/api/admin"
import {
  type Member,
  type MemberGrade,
  type MemberStatus,
} from "@/lib/api/auth"
import { ApiError, type PageResponse } from "@/lib/api/types"
import { cn } from "@/lib/utils"

type PendingAction = {
  memberId: number
  type: "grade" | "status"
} | null

const pageSize = 20
const defaultSort = "createdAt,desc"

const gradeOptions = [
  { value: "BRONZE", label: "브론즈" },
  { value: "SILVER", label: "실버" },
  { value: "GOLD", label: "골드" },
] satisfies Array<{ value: MemberGrade; label: string }>

const statusOptions = [
  { value: "ACTIVE", label: "활성" },
  { value: "SUSPENDED", label: "정지" },
] satisfies Array<{ value: AdminMemberMutableStatus; label: string }>

const inputClassName =
  "h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950 disabled:bg-neutral-100 disabled:text-neutral-400"

export function MembersAdminView() {
  const [page, setPage] = useState(0)
  const [includeWithdrawn, setIncludeWithdrawn] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [members, setMembers] = useState<PageResponse<Member> | null>(null)
  const [gradeDrafts, setGradeDrafts] = useState<Record<number, MemberGrade>>({})
  const [statusDrafts, setStatusDrafts] = useState<
    Record<number, AdminMemberMutableStatus>
  >({})
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<"success" | "error">(
    "success"
  )
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  useEffect(() => {
    let isActive = true

    async function loadMembers() {
      setIsLoading(true)
      setMessage(null)

      try {
        const nextMembers = await getAdminMembers({
          includeWithdrawn,
          page,
          size: pageSize,
          sort: defaultSort,
        })

        if (!isActive) {
          return
        }

        setMembers(nextMembers)
        setGradeDrafts((current) => {
          const nextDrafts = { ...current }

          for (const member of nextMembers.content) {
            nextDrafts[member.id] = current[member.id] ?? member.grade
          }

          return nextDrafts
        })
        setStatusDrafts((current) => {
          const nextDrafts = { ...current }

          for (const member of nextMembers.content) {
            if (member.status !== "WITHDRAWN") {
              nextDrafts[member.id] =
                current[member.id] ?? member.status
            }
          }

          return nextDrafts
        })
      } catch (error) {
        if (isActive) {
          setMessageTone("error")
          setMessage(getAdminErrorMessage(error))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadMembers()

    return () => {
      isActive = false
    }
  }, [includeWithdrawn, page, reloadKey])

  function handleIncludeWithdrawnChange(event: ChangeEvent<HTMLInputElement>) {
    setIncludeWithdrawn(event.currentTarget.checked)
    setPage(0)
  }

  function handleGradeChange(
    memberId: number,
    event: ChangeEvent<HTMLSelectElement>
  ) {
    const grade = event.currentTarget.value as MemberGrade

    setGradeDrafts((current) => ({
      ...current,
      [memberId]: grade,
    }))
    setMessage(null)
  }

  function handleStatusChange(
    memberId: number,
    event: ChangeEvent<HTMLSelectElement>
  ) {
    const status = event.currentTarget.value as AdminMemberMutableStatus

    setStatusDrafts((current) => ({
      ...current,
      [memberId]: status,
    }))
    setMessage(null)
  }

  async function handleGradeSubmit(member: Member) {
    const grade = gradeDrafts[member.id] ?? member.grade

    setPendingAction({ memberId: member.id, type: "grade" })
    setMessage(null)

    try {
      const updatedMember = await updateAdminMemberGrade(member.id, { grade })

      updateMemberInList(updatedMember)
      setMessageTone("success")
      setMessage("회원 등급을 변경했습니다.")
    } catch (error) {
      setMessageTone("error")
      setMessage(getAdminErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleStatusSubmit(member: Member) {
    if (member.status === "WITHDRAWN") {
      return
    }

    const status = statusDrafts[member.id] ?? member.status

    setPendingAction({ memberId: member.id, type: "status" })
    setMessage(null)

    try {
      const updatedMember = await updateAdminMemberStatus(member.id, { status })

      updateMemberInList(updatedMember)
      setMessageTone("success")
      setMessage("회원 상태를 변경했습니다.")
    } catch (error) {
      setMessageTone("error")
      setMessage(getAdminErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  function updateMemberInList(updatedMember: Member) {
    setMembers((current) =>
      current
        ? {
            ...current,
            content: current.content.map((member) =>
              member.id === updatedMember.id ? updatedMember : member
            ),
          }
        : current
    )
    setGradeDrafts((current) => ({
      ...current,
      [updatedMember.id]: updatedMember.grade,
    }))

    if (updatedMember.status !== "WITHDRAWN") {
      setStatusDrafts((current) => ({
        ...current,
        [updatedMember.id]: updatedMember.status,
      }))
    }
  }

  function movePage(nextPage: number) {
    setPage(Math.max(nextPage, 0))
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <UsersRound className="size-5 text-neutral-500" />
          <h2 className="text-lg font-bold">회원 목록</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={includeWithdrawn}
              onChange={handleIncludeWithdrawnChange}
            />
            탈퇴 회원 포함
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => setReloadKey((current) => current + 1)}
          >
            <RefreshCw data-icon="inline-start" />
            새로고침
          </Button>
        </div>
      </div>

      {message && (
        <p
          className={
            messageTone === "success"
              ? "mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700"
              : "mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          }
          role={messageTone === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      {isLoading && (
        <p className="mt-5 text-sm text-neutral-600">
          회원 목록을 불러오고 있습니다.
        </p>
      )}

      {!isLoading && members?.content.length === 0 && (
        <p className="mt-5 text-sm text-neutral-600">
          표시할 회원이 없습니다.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {members?.content.map((member) => {
          const isWithdrawn = member.status === "WITHDRAWN"
          const isGradePending =
            pendingAction?.memberId === member.id &&
            pendingAction.type === "grade"
          const isStatusPending =
            pendingAction?.memberId === member.id &&
            pendingAction.type === "status"

          return (
            <article
              key={member.id}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{member.nickname}</h3>
                    <MemberStatusPill status={member.status} />
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                      {member.role ?? "USER"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    {member.email} · {member.name} · ID {member.id}
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    마일리지 {member.mileage.toLocaleString()}P
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:w-[560px]">
                  <Button variant="outline" className="w-fit" asChild>
                    <Link href={`/admin/members/${member.id}`}>상세 보기</Link>
                  </Button>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <select
                      value={gradeDrafts[member.id] ?? member.grade}
                      disabled={isGradePending || isStatusPending}
                      className={inputClassName}
                      aria-label={`${member.nickname} 등급`}
                      onChange={(event) => handleGradeChange(member.id, event)}
                    >
                      {gradeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isGradePending || isStatusPending}
                      onClick={() => handleGradeSubmit(member)}
                    >
                      <ShieldCheck data-icon="inline-start" />
                      {isGradePending ? "변경 중" : "등급 변경"}
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row">
                    <select
                      value={
                        isWithdrawn
                          ? "ACTIVE"
                          : statusDrafts[member.id] ?? member.status
                      }
                      disabled={isWithdrawn || isGradePending || isStatusPending}
                      className={inputClassName}
                      aria-label={`${member.nickname} 상태`}
                      onChange={(event) => handleStatusChange(member.id, event)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      disabled={isWithdrawn || isGradePending || isStatusPending}
                      onClick={() => handleStatusSubmit(member)}
                    >
                      <RefreshCw data-icon="inline-start" />
                      {isStatusPending ? "변경 중" : "상태 변경"}
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {members && members.totalPages > 1 && (
        <nav
          className="mt-6 flex items-center justify-center gap-2"
          aria-label="관리자 회원 목록 페이지"
        >
          <Button
            type="button"
            variant="outline"
            disabled={members.first}
            onClick={() => movePage(page - 1)}
          >
            <ArrowLeft data-icon="inline-start" />
            이전
          </Button>
          <span className="px-2 text-sm text-neutral-600">
            {members.number + 1} / {members.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={members.last}
            onClick={() => movePage(page + 1)}
          >
            다음
            <ArrowRight data-icon="inline-end" />
          </Button>
        </nav>
      )}
    </section>
  )
}

function MemberStatusPill({ status }: { status: MemberStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        status === "ACTIVE" && "bg-neutral-950 text-white",
        status === "SUSPENDED" && "bg-red-50 text-red-700",
        status === "WITHDRAWN" && "bg-neutral-200 text-neutral-600"
      )}
    >
      {getMemberStatusLabel(status)}
    </span>
  )
}

function getMemberStatusLabel(status: MemberStatus) {
  if (status === "ACTIVE") {
    return "활성"
  }

  if (status === "SUSPENDED") {
    return "정지"
  }

  return "탈퇴"
}

function getAdminErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "관리자 요청을 처리하지 못했습니다."
}
