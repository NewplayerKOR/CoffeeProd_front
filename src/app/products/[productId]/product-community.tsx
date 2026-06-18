"use client"

import Link from "next/link"
import { MessageCircle, Pencil, Send, Star, Trash2 } from "lucide-react"
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import { getMe } from "@/lib/api/auth"
import { getStoredAuthTokens } from "@/lib/api/auth-token-storage"
import {
  createQna,
  deleteQna,
  getProductQnas,
  type Qna,
  updateQna,
} from "@/lib/api/qna"
import {
  createReview,
  deleteReview,
  getProductReviews,
  type Review,
  updateReview,
} from "@/lib/api/review"
import { ApiError, type PageResponse } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const textareaClassName =
  "min-h-28 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950"
const inputClassName =
  "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950"

type ProductCommunityProps = {
  productId: number
}

export function ProductReviews({ productId }: ProductCommunityProps) {
  const nickname = useCurrentNickname()
  const [reviews, setReviews] = useState<PageResponse<Review> | null>(null)
  const [page, setPage] = useState(0)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadReviews = useCallback(async () => {
    try {
      setReviews(
        await getProductReviews(productId, {
          page,
          size: 10,
          sort: "createdAt,desc",
        })
      )
    } catch (error) {
      setMessage(getCommunityErrorMessage(error, "리뷰를 불러오지 못했습니다."))
    } finally {
      setIsLoading(false)
    }
  }, [page, productId])

  useEffect(() => {
    let isActive = true

    void getProductReviews(productId, {
      page,
      size: 10,
      sort: "createdAt,desc",
    })
      .then((nextReviews) => {
        if (isActive) {
          setReviews(nextReviews)
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setMessage(
            getCommunityErrorMessage(error, "리뷰를 불러오지 못했습니다.")
          )
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
  }, [page, productId])

  const myReview = reviews?.content.find((review) => review.nickname === nickname)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!nickname) {
      setMessage("로그인 후 리뷰를 작성할 수 있습니다.")
      return
    }

    const normalizedContent = content.trim()

    if (!normalizedContent) {
      setMessage("리뷰 내용을 입력해 주세요.")
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      if (editingId) {
        await updateReview(editingId, { rating, content: normalizedContent })
        setMessage("리뷰를 수정했습니다.")
      } else {
        await createReview(productId, { rating, content: normalizedContent })
        setMessage("리뷰를 등록했습니다.")
      }

      setEditingId(null)
      setRating(5)
      setContent("")
      await loadReviews()
    } catch (error) {
      setMessage(getCommunityErrorMessage(error, "리뷰 요청을 처리하지 못했습니다."))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(reviewId: number) {
    setIsSubmitting(true)
    setMessage(null)

    try {
      await deleteReview(reviewId)
      setEditingId(null)
      setContent("")
      setMessage("리뷰를 삭제했습니다.")
      await loadReviews()
    } catch (error) {
      setMessage(getCommunityErrorMessage(error, "리뷰를 삭제하지 못했습니다."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">구매 후기</h2>
          <p className="mt-1 text-sm text-neutral-500">
            실제 구매를 완료한 회원만 리뷰를 작성할 수 있습니다.
          </p>
        </div>
        <span className="text-sm font-medium text-neutral-500">
          총 {reviews?.totalElements ?? 0}개
        </span>
      </div>

      {message && (
        <p className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm font-medium" role="status">
          {message}
        </p>
      )}

      {nickname && (!myReview || editingId) ? (
        <form className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="sm:w-36">
              <span className="mb-2 block text-sm font-semibold">평점</span>
              <select
                value={rating}
                className={inputClassName}
                disabled={isSubmitting}
                onChange={(event) => setRating(Number(event.currentTarget.value))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}점
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 flex-1">
              <span className="mb-2 block text-sm font-semibold">리뷰 내용</span>
              <textarea
                value={content}
                maxLength={1000}
                required
                className={textareaClassName}
                placeholder="원두의 향과 맛, 배송 경험을 남겨주세요."
                disabled={isSubmitting}
                onChange={(event) => setContent(event.currentTarget.value)}
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting}>
              <Send data-icon="inline-start" />
              {isSubmitting ? "저장 중" : editingId ? "수정 완료" : "리뷰 등록"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null)
                  setRating(5)
                  setContent("")
                }}
              >
                취소
              </Button>
            )}
          </div>
        </form>
      ) : !nickname ? (
        <p className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          리뷰를 작성하려면 <Link href="/login" className="font-semibold underline">로그인</Link>해 주세요.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        {isLoading ? (
          <EmptyCommunityState>리뷰를 불러오고 있습니다.</EmptyCommunityState>
        ) : reviews?.content.length ? (
          reviews.content.map((review) => {
            const isOwner = review.nickname === nickname

            return (
              <article key={review.id} className="rounded-lg border border-neutral-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{review.nickname}</p>
                    <div className="mt-1 flex items-center gap-1" aria-label={`평점 ${review.rating}점`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          className={cn(
                            "size-4",
                            index < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-neutral-300"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <time className="text-xs text-neutral-500">{formatDate(review.createdAt)}</time>
                    {isOwner && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="리뷰 수정"
                          onClick={() => {
                            setEditingId(review.id)
                            setRating(review.rating)
                            setContent(review.content)
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="리뷰 삭제"
                          disabled={isSubmitting}
                          onClick={() => void handleDelete(review.id)}
                        >
                          <Trash2 />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{review.content}</p>
              </article>
            )
          })
        ) : (
          <EmptyCommunityState>첫 번째 구매 후기를 남겨보세요.</EmptyCommunityState>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={reviews?.totalPages ?? 0}
        onPageChange={setPage}
      />
    </section>
  )
}

export function ProductQnas({ productId }: ProductCommunityProps) {
  const nickname = useCurrentNickname()
  const [qnas, setQnas] = useState<PageResponse<Qna> | null>(null)
  const [page, setPage] = useState(0)
  const [title, setTitle] = useState("")
  const [question, setQuestion] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadQnas = useCallback(async () => {
    try {
      setQnas(
        await getProductQnas(productId, {
          page,
          size: 10,
          sort: "createdAt,desc",
        })
      )
    } catch (error) {
      setMessage(getCommunityErrorMessage(error, "상품 문의를 불러오지 못했습니다."))
    } finally {
      setIsLoading(false)
    }
  }, [page, productId])

  useEffect(() => {
    let isActive = true

    void getProductQnas(productId, {
      page,
      size: 10,
      sort: "createdAt,desc",
    })
      .then((nextQnas) => {
        if (isActive) {
          setQnas(nextQnas)
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setMessage(
            getCommunityErrorMessage(error, "상품 문의를 불러오지 못했습니다.")
          )
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
  }, [page, productId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!nickname) {
      setMessage("로그인 후 상품 문의를 작성할 수 있습니다.")
      return
    }

    const payload = { title: title.trim(), question: question.trim() }

    if (!payload.title || !payload.question) {
      setMessage("문의 제목과 내용을 모두 입력해 주세요.")
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      if (editingId) {
        await updateQna(editingId, payload)
        setMessage("상품 문의를 수정했습니다.")
      } else {
        await createQna(productId, payload)
        setMessage("상품 문의를 등록했습니다.")
      }

      resetQnaForm()
      await loadQnas()
    } catch (error) {
      setMessage(getCommunityErrorMessage(error, "상품 문의 요청을 처리하지 못했습니다."))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(qnaId: number) {
    setIsSubmitting(true)
    setMessage(null)

    try {
      await deleteQna(qnaId)
      resetQnaForm()
      setMessage("상품 문의를 삭제했습니다.")
      await loadQnas()
    } catch (error) {
      setMessage(getCommunityErrorMessage(error, "상품 문의를 삭제하지 못했습니다."))
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetQnaForm() {
    setEditingId(null)
    setTitle("")
    setQuestion("")
  }

  return (
    <section>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">상품 Q&A</h2>
          <p className="mt-1 text-sm text-neutral-500">상품과 배송에 대해 궁금한 내용을 남겨주세요.</p>
        </div>
        <span className="text-sm font-medium text-neutral-500">총 {qnas?.totalElements ?? 0}개</span>
      </div>

      {message && (
        <p className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm font-medium" role="status">
          {message}
        </p>
      )}

      {nickname ? (
        <form className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4" onSubmit={handleSubmit}>
          <label>
            <span className="mb-2 block text-sm font-semibold">문의 제목</span>
            <input
              value={title}
              maxLength={200}
              required
              className={inputClassName}
              placeholder="문의 제목을 입력하세요."
              disabled={isSubmitting}
              onChange={(event) => setTitle(event.currentTarget.value)}
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold">문의 내용</span>
            <textarea
              value={question}
              maxLength={2000}
              required
              className={textareaClassName}
              placeholder="상품에 대해 궁금한 내용을 입력하세요."
              disabled={isSubmitting}
              onChange={(event) => setQuestion(event.currentTarget.value)}
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting}>
              <MessageCircle data-icon="inline-start" />
              {isSubmitting ? "저장 중" : editingId ? "수정 완료" : "문의 등록"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetQnaForm}>취소</Button>
            )}
          </div>
        </form>
      ) : (
        <p className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          문의를 작성하려면 <Link href="/login" className="font-semibold underline">로그인</Link>해 주세요.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {isLoading ? (
          <EmptyCommunityState>상품 문의를 불러오고 있습니다.</EmptyCommunityState>
        ) : qnas?.content.length ? (
          qnas.content.map((qna) => {
            const canEdit = qna.nickname === nickname && qna.status === "WAITING"

            return (
              <article key={qna.id} className="rounded-lg border border-neutral-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        qna.status === "ANSWERED"
                          ? "bg-neutral-950 text-white"
                          : "bg-neutral-100 text-neutral-600"
                      )}>
                        {qna.status === "ANSWERED" ? "답변 완료" : "답변 대기"}
                      </span>
                      <h3 className="font-bold">{qna.title}</h3>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">
                      {qna.nickname} · {formatDate(qna.createdAt)}
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="문의 수정"
                        onClick={() => {
                          setEditingId(qna.id)
                          setTitle(qna.title)
                          setQuestion(qna.question)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="문의 삭제"
                        disabled={isSubmitting}
                        onClick={() => void handleDelete(qna.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{qna.question}</p>
                {qna.answer && (
                  <div className="mt-4 rounded-lg bg-neutral-100 p-4">
                    <p className="text-sm font-semibold">CoffeeProd 답변</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{qna.answer}</p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {qna.answererNickname ?? "관리자"}
                      {qna.answeredAt ? ` · ${formatDate(qna.answeredAt)}` : ""}
                    </p>
                  </div>
                )}
              </article>
            )
          })
        ) : (
          <EmptyCommunityState>등록된 상품 문의가 없습니다.</EmptyCommunityState>
        )}
      </div>

      <Pagination page={page} totalPages={qnas?.totalPages ?? 0} onPageChange={setPage} />
    </section>
  )
}

function useCurrentNickname() {
  const [nickname, setNickname] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    if (!getStoredAuthTokens()) {
      return
    }

    void getMe()
      .then((member) => {
        if (isActive) {
          setNickname(member.nickname)
        }
      })
      .catch(() => undefined)

    return () => {
      isActive = false
    }
  }, [])

  return nickname
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <Button type="button" variant="outline" size="sm" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
        이전
      </Button>
      <span className="text-sm text-neutral-500">{page + 1} / {totalPages}</span>
      <Button type="button" variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>
        다음
      </Button>
    </div>
  )
}

function EmptyCommunityState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
      {children}
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value))
}

function getCommunityErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}
