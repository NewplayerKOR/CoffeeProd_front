"use client"

import Link from "next/link"
import { MessageCircle, RefreshCw, Send } from "lucide-react"
import { type ReactNode, useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  answerAdminQna,
  getAdminQnas,
  type Qna,
  type QnaStatus,
} from "@/lib/api/qna"
import { ApiError, type PageResponse } from "@/lib/api/types"
import { cn } from "@/lib/utils"

type StatusFilter = QnaStatus | "ALL"

export function QnasAdminView() {
  const [qnas, setQnas] = useState<PageResponse<Qna> | null>(null)
  const [status, setStatus] = useState<StatusFilter>("WAITING")
  const [page, setPage] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadQnas = useCallback(async () => {
    try {
      setQnas(
        await getAdminQnas({
          status: status === "ALL" ? undefined : status,
          page,
          size: 20,
          sort: "createdAt,desc",
        })
      )
    } catch (error) {
      setMessage(getQnaErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    let isActive = true

    void getAdminQnas({
      status: status === "ALL" ? undefined : status,
      page,
      size: 20,
      sort: "createdAt,desc",
    })
      .then((nextQnas) => {
        if (isActive) {
          setQnas(nextQnas)
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setMessage(getQnaErrorMessage(error))
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [page, status])

  async function handleAnswer(qnaId: number) {
    const answer = answers[qnaId]?.trim()

    if (!answer) {
      setMessage("답변 내용을 입력해 주세요.")
      return
    }

    setPendingId(qnaId)
    setMessage(null)

    try {
      await answerAdminQna(qnaId, answer)
      setAnswers((current) => ({ ...current, [qnaId]: "" }))
      setMessage("문의 답변을 등록했습니다.")
      await loadQnas()
    } catch (error) {
      setMessage(getQnaErrorMessage(error))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <label className="w-full sm:max-w-48">
          <span className="mb-2 block text-sm font-semibold">문의 상태</span>
          <select
            value={status}
            className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950"
            onChange={(event) => {
              setStatus(event.currentTarget.value as StatusFilter)
              setPage(0)
            }}
          >
            <option value="WAITING">답변 대기</option>
            <option value="ANSWERED">답변 완료</option>
            <option value="ALL">전체</option>
          </select>
        </label>
        <Button type="button" variant="outline" onClick={() => void loadQnas()}>
          <RefreshCw data-icon="inline-start" />
          새로고침
        </Button>
      </section>

      {message && (
        <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm font-medium" role="status">
          {message}
        </p>
      )}

      {isLoading ? (
        <EmptyState>상품 문의를 불러오고 있습니다.</EmptyState>
      ) : qnas?.content.length ? (
        <section className="flex flex-col gap-4">
          {qnas.content.map((qna) => {
            const isPending = pendingId === qna.id

            return (
              <article key={qna.id} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        qna.status === "ANSWERED"
                          ? "bg-neutral-950 text-white"
                          : "bg-amber-100 text-amber-900"
                      )}>
                        {qna.status === "ANSWERED" ? "답변 완료" : "답변 대기"}
                      </span>
                      <h2 className="font-bold">{qna.title}</h2>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">
                      {qna.nickname} · {formatDateTime(qna.createdAt)} · 상품 #{qna.productId}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/products/${qna.productId}?tab=qna`}>상품 문의 보기</Link>
                  </Button>
                </div>

                <div className="mt-4 rounded-lg bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
                  {qna.question}
                </div>

                {qna.status === "WAITING" ? (
                  <div className="mt-4">
                    <label htmlFor={`answer-${qna.id}`} className="mb-2 block text-sm font-semibold">
                      답변 내용
                    </label>
                    <textarea
                      id={`answer-${qna.id}`}
                      value={answers[qna.id] ?? ""}
                      maxLength={2000}
                      className="min-h-28 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-950"
                      placeholder="고객에게 전달할 답변을 입력하세요."
                      disabled={isPending}
                      onChange={(event) => {
                        const value = event.currentTarget.value
                        setAnswers((current) => ({ ...current, [qna.id]: value }))
                      }}
                    />
                    <Button className="mt-3" disabled={isPending} onClick={() => void handleAnswer(qna.id)}>
                      <Send data-icon="inline-start" />
                      {isPending ? "등록 중" : "답변 등록"}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-neutral-200 p-4">
                    <p className="text-sm font-semibold">등록된 답변</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{qna.answer}</p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {qna.answererNickname ?? "관리자"}
                      {qna.answeredAt ? ` · ${formatDateTime(qna.answeredAt)}` : ""}
                    </p>
                  </div>
                )}
              </article>
            )
          })}
        </section>
      ) : (
        <EmptyState>조건에 맞는 상품 문의가 없습니다.</EmptyState>
      )}

      {qnas && qnas.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((current) => current - 1)}>
            이전
          </Button>
          <span className="text-sm text-neutral-500">{page + 1} / {qnas.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= qnas.totalPages} onClick={() => setPage((current) => current + 1)}>
            다음
          </Button>
        </div>
      )}
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
      <MessageCircle className="mx-auto mb-3 size-6" />
      {children}
    </section>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getQnaErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "상품 문의 요청을 처리하지 못했습니다."
}
