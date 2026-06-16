"use client"

import { Check, FolderTree, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react"
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  createAdminCategory,
  deleteAdminCategory,
  updateAdminCategory,
} from "@/lib/api/admin"
import { getCategories, getCategory, type Category } from "@/lib/api/catalog"
import { ApiError } from "@/lib/api/types"

const inputClassName =
  "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950 disabled:bg-neutral-100 disabled:text-neutral-400"

export function AdminCategoriesView() {
  const [categories, setCategories] = useState<Category[]>([])
  const [draftName, setDraftName] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<"success" | "error">(
    "success"
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingCategoryId, setPendingCategoryId] = useState<number | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadCategories() {
      setIsLoading(true)
      setMessage(null)

      try {
        const nextCategories = await getCategories()

        if (isActive) {
          setCategories(nextCategories)
        }
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

    void loadCategories()

    return () => {
      isActive = false
    }
  }, [])

  function handleDraftChange(event: ChangeEvent<HTMLInputElement>) {
    setDraftName(event.currentTarget.value)
    setMessage(null)
  }

  function handleEditingChange(event: ChangeEvent<HTMLInputElement>) {
    setEditingName(event.currentTarget.value)
    setMessage(null)
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = draftName.trim()

    if (!name) {
      setMessageTone("error")
      setMessage("카테고리명을 입력해 주세요.")
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const createdCategory = await createAdminCategory({ name })

      setCategories((current) => [...current, createdCategory])
      setDraftName("")
      setMessageTone("success")
      setMessage("카테고리를 생성했습니다.")
    } catch (error) {
      setMessageTone("error")
      setMessage(getAdminErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (editingId === null) {
      return
    }

    const name = editingName.trim()

    if (!name) {
      setMessageTone("error")
      setMessage("수정할 카테고리명을 입력해 주세요.")
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const updatedCategory = await updateAdminCategory(editingId, { name })

      setCategories((current) =>
        current.map((category) =>
          category.id === updatedCategory.id ? updatedCategory : category
        )
      )
      clearEditing()
      setMessageTone("success")
      setMessage("카테고리를 수정했습니다.")
    } catch (error) {
      setMessageTone("error")
      setMessage(getAdminErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function startEditing(category: Category) {
    setPendingCategoryId(category.id)
    setMessage(null)

    try {
      const latestCategory = await getCategory(category.id)

      setEditingId(latestCategory.id)
      setEditingName(latestCategory.name)
    } catch (error) {
      setMessageTone("error")
      setMessage(getAdminErrorMessage(error))
    } finally {
      setPendingCategoryId(null)
    }
  }

  async function handleDelete(category: Category) {
    setPendingCategoryId(category.id)
    setMessage(null)

    try {
      await deleteAdminCategory(category.id)
      setCategories((current) =>
        current.filter((item) => item.id !== category.id)
      )

      if (editingId === category.id) {
        clearEditing()
      }

      setMessageTone("success")
      setMessage("카테고리를 삭제했습니다.")
    } catch (error) {
      setMessageTone("error")
      setMessage(getAdminErrorMessage(error))
    } finally {
      setPendingCategoryId(null)
    }
  }

  function clearEditing() {
    setEditingId(null)
    setEditingName("")
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <form
          className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
          onSubmit={handleCreate}
        >
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-neutral-500" />
            <h2 className="text-lg font-bold">카테고리 생성</h2>
          </div>
          <label
            className="mt-5 block text-sm font-semibold"
            htmlFor="category-name"
          >
            카테고리명
          </label>
          <input
            id="category-name"
            value={draftName}
            maxLength={50}
            disabled={isSubmitting}
            className={`${inputClassName} mt-2`}
            placeholder="예: 싱글 오리진"
            onChange={handleDraftChange}
          />
          <Button type="submit" disabled={isSubmitting} className="mt-4 w-full">
            <Plus data-icon="inline-start" />
            {isSubmitting ? "처리 중" : "생성"}
          </Button>
        </form>

        {editingId !== null && (
          <form
            className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
            onSubmit={handleUpdate}
          >
            <div className="flex items-center gap-2">
              <Pencil className="size-5 text-neutral-500" />
              <h2 className="text-lg font-bold">카테고리 수정</h2>
            </div>
            <label
              className="mt-5 block text-sm font-semibold"
              htmlFor="editing-category-name"
            >
              카테고리명
            </label>
            <input
              id="editing-category-name"
              value={editingName}
              maxLength={50}
              disabled={isSubmitting}
              className={`${inputClassName} mt-2`}
              onChange={handleEditingChange}
            />
            <div className="mt-4 flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                <Check data-icon="inline-start" />
                저장
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={clearEditing}
              >
                <RotateCcw data-icon="inline-start" />
                취소
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderTree className="size-5 text-neutral-500" />
            <h2 className="text-lg font-bold">카테고리 목록</h2>
          </div>
          <span className="text-sm text-neutral-500">
            {categories.length.toLocaleString()}개
          </span>
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
            카테고리 목록을 불러오고 있습니다.
          </p>
        )}

        {!isLoading && categories.length === 0 && (
          <p className="mt-5 text-sm text-neutral-600">
            등록된 카테고리가 없습니다.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold">{category.name}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  ID {category.id}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pendingCategoryId === category.id}
                  onClick={() => void startEditing(category)}
                >
                  <Pencil data-icon="inline-start" />
                  수정
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pendingCategoryId === category.id}
                  onClick={() => void handleDelete(category)}
                >
                  <Trash2 data-icon="inline-start" />
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function getAdminErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "관리자 요청을 처리하지 못했습니다."
}
