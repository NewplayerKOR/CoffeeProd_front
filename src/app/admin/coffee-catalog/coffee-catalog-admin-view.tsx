"use client"

import {
  Bean,
  Check,
  Database,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  createAdminCoffeeProfile,
  createAdminCoffeeReference,
  getAdminCoffeeProfile,
  getAdminCoffeeProfiles,
  getAdminCoffeeReferences,
  updateAdminCoffeeProfile,
  updateAdminCoffeeReference,
  type CoffeeProfile,
  type CoffeeProfileRequest,
  type CoffeeReference,
  type CoffeeReferenceKind,
} from "@/lib/api/coffee"
import { ApiError } from "@/lib/api/types"
import { getBeanTypeLabel, getRoastLevelLabel } from "@/lib/coffee-display"

import { CoffeeProfileAdminForm } from "./coffee-profile-admin-form"

type CatalogTab = "profiles" | CoffeeReferenceKind
type ReferenceDraft = {
  code: string
  name: string
  description: string
}

const referenceTabs: Array<{
  value: CoffeeReferenceKind
  label: string
}> = [
  { value: "processing-methods", label: "가공 방식" },
  { value: "flavor-notes", label: "향미" },
  { value: "brew-methods", label: "추출 방식" },
  { value: "coffee-varieties", label: "품종" },
]

const emptyReferenceDraft: ReferenceDraft = {
  code: "",
  name: "",
  description: "",
}

const emptyReferences: Record<CoffeeReferenceKind, CoffeeReference[]> = {
  "processing-methods": [],
  "flavor-notes": [],
  "brew-methods": [],
  "coffee-varieties": [],
}

const inputClassName =
  "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950 disabled:bg-neutral-100"
const textareaClassName =
  "min-h-24 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950 disabled:bg-neutral-100"

export function CoffeeCatalogAdminView() {
  const [activeTab, setActiveTab] = useState<CatalogTab>("profiles")
  const [profiles, setProfiles] = useState<CoffeeProfile[]>([])
  const [references, setReferences] =
    useState<Record<CoffeeReferenceKind, CoffeeReference[]>>(emptyReferences)
  const [profileEditor, setProfileEditor] = useState<{
    key: string
    profile: CoffeeProfile | null
  } | null>(null)
  const [referenceDraft, setReferenceDraft] =
    useState<ReferenceDraft>(emptyReferenceDraft)
  const [editingReferenceId, setEditingReferenceId] = useState<number | null>(
    null
  )
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<"success" | "error">(
    "success"
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingProfileId, setPendingProfileId] = useState<number | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadCatalog() {
      try {
        const [profilePage, processingMethods, flavorNotes, brewMethods, varieties] =
          await Promise.all([
            getAdminCoffeeProfiles({ page: 0, size: 100, sort: "profileName,asc" }),
            getAdminCoffeeReferences("processing-methods"),
            getAdminCoffeeReferences("flavor-notes"),
            getAdminCoffeeReferences("brew-methods"),
            getAdminCoffeeReferences("coffee-varieties"),
          ])

        if (!isActive) {
          return
        }

        setProfiles(profilePage.content)
        setReferences({
          "processing-methods": processingMethods,
          "flavor-notes": flavorNotes,
          "brew-methods": brewMethods,
          "coffee-varieties": varieties,
        })
      } catch (error) {
        if (isActive) {
          showError(error)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadCatalog()

    return () => {
      isActive = false
    }
  }, [])

  function showError(error: unknown) {
    setMessageTone("error")
    setMessage(getAdminErrorMessage(error))
  }

  function selectTab(tab: CatalogTab) {
    setActiveTab(tab)
    setProfileEditor(null)
    clearReferenceForm()
    setMessage(null)
  }

  async function refreshProfiles() {
    const profilePage = await getAdminCoffeeProfiles({
      page: 0,
      size: 100,
      sort: "profileName,asc",
    })
    setProfiles(profilePage.content)
  }

  async function refreshReferences(kind: CoffeeReferenceKind) {
    const nextReferences = await getAdminCoffeeReferences(kind)
    setReferences((current) => ({ ...current, [kind]: nextReferences }))
  }

  async function startProfileEditing(profile: CoffeeProfile) {
    setPendingProfileId(profile.id)
    setMessage(null)

    try {
      const latestProfile = await getAdminCoffeeProfile(profile.id)
      setProfileEditor({ key: `edit-${latestProfile.id}`, profile: latestProfile })
    } catch (error) {
      showError(error)
    } finally {
      setPendingProfileId(null)
    }
  }

  async function saveProfile(payload: CoffeeProfileRequest) {
    try {
      if (profileEditor?.profile) {
        await updateAdminCoffeeProfile(profileEditor.profile.id, payload)
      } else {
        await createAdminCoffeeProfile(payload)
      }

      await refreshProfiles()
      setProfileEditor(null)
      setMessageTone("success")
      setMessage("커피 프로필을 저장했습니다.")
    } catch (error) {
      throw new Error(getAdminErrorMessage(error))
    }
  }

  function startReferenceEditing(reference: CoffeeReference) {
    setEditingReferenceId(reference.id)
    setReferenceDraft({
      code: reference.code,
      name: reference.name,
      description: reference.description ?? "",
    })
    setMessage(null)
  }

  function clearReferenceForm() {
    setEditingReferenceId(null)
    setReferenceDraft(emptyReferenceDraft)
  }

  async function saveReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (activeTab === "profiles") {
      return
    }

    const code = referenceDraft.code.trim().toUpperCase()
    const name = referenceDraft.name.trim()

    if ((!editingReferenceId && !code) || !name) {
      setMessageTone("error")
      setMessage("코드와 이름을 입력해 주세요.")
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const description = referenceDraft.description.trim() || null

      if (editingReferenceId) {
        await updateAdminCoffeeReference(activeTab, editingReferenceId, {
          name,
          description,
        })
      } else {
        await createAdminCoffeeReference(activeTab, {
          code,
          name,
          description,
        })
      }

      await refreshReferences(activeTab)
      clearReferenceForm()
      setMessageTone("success")
      setMessage("기준정보를 저장했습니다.")
    } catch (error) {
      showError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeReferences =
    activeTab === "profiles" ? [] : references[activeTab]

  return (
    <section className="flex flex-col gap-5">
      <nav className="flex flex-wrap gap-2" aria-label="커피 카탈로그 관리 항목">
        <Button
          type="button"
          variant={activeTab === "profiles" ? "default" : "outline"}
          onClick={() => selectTab("profiles")}
        >
          <Bean data-icon="inline-start" />
          커피 프로필
        </Button>
        {referenceTabs.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            variant={activeTab === tab.value ? "default" : "outline"}
            onClick={() => selectTab(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </nav>

      {message && (
        <p
          className={
            messageTone === "success"
              ? "rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700"
              : "rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          }
          role={messageTone === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
          커피 카탈로그를 불러오고 있습니다.
        </div>
      ) : activeTab === "profiles" ? (
        <div className="flex flex-col gap-5">
          {profileEditor ? (
            <CoffeeProfileAdminForm
              key={profileEditor.key}
              profile={profileEditor.profile}
              processingMethods={references["processing-methods"]}
              flavorNotes={references["flavor-notes"]}
              brewMethods={references["brew-methods"]}
              varieties={references["coffee-varieties"]}
              onSave={saveProfile}
              onCancel={() => setProfileEditor(null)}
            />
          ) : (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() =>
                  setProfileEditor({ key: `new-${Date.now()}`, profile: null })
                }
              >
                <Plus data-icon="inline-start" />
                프로필 등록
              </Button>
            </div>
          )}

          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bean className="size-5 text-neutral-500" />
                <h2 className="text-lg font-bold">커피 프로필 목록</h2>
              </div>
              <span className="text-sm text-neutral-500">{profiles.length}개</span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {profiles.map((profile) => (
                <article
                  key={profile.id}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{profile.profileName}</h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        {getBeanTypeLabel(profile.beanType)} · {getRoastLevelLabel(profile.roastLevel)}
                        {profile.decaf ? " · 디카페인" : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pendingProfileId === profile.id}
                      onClick={() => void startProfileEditing(profile)}
                    >
                      <Pencil data-icon="inline-start" />
                      수정
                    </Button>
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-neutral-600">
                    {profile.summary || "등록된 프로필 설명이 없습니다."}
                  </p>
                </article>
              ))}
            </div>
            {profiles.length === 0 && (
              <p className="mt-5 text-sm text-neutral-600">
                등록된 커피 프로필이 없습니다.
              </p>
            )}
          </div>
        </div>
      ) : (
        <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <form
            className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
            onSubmit={saveReference}
          >
            <div className="flex items-center gap-2">
              {editingReferenceId ? (
                <Pencil className="size-5 text-neutral-500" />
              ) : (
                <Plus className="size-5 text-neutral-500" />
              )}
              <h2 className="text-lg font-bold">
                기준정보 {editingReferenceId ? "수정" : "생성"}
              </h2>
            </div>

            <label className="mt-5 block text-sm font-semibold" htmlFor="reference-code">
              코드
            </label>
            <input
              id="reference-code"
              value={referenceDraft.code}
              maxLength={50}
              disabled={isSubmitting || editingReferenceId !== null}
              className={`${inputClassName} mt-2 uppercase`}
              placeholder="예: WASHED"
              onChange={(event) =>
                setReferenceDraft((current) => ({
                  ...current,
                  code: event.currentTarget.value,
                }))
              }
            />

            <label className="mt-4 block text-sm font-semibold" htmlFor="reference-name">
              이름
            </label>
            <input
              id="reference-name"
              value={referenceDraft.name}
              maxLength={100}
              disabled={isSubmitting}
              className={`${inputClassName} mt-2`}
              onChange={(event) =>
                setReferenceDraft((current) => ({
                  ...current,
                  name: event.currentTarget.value,
                }))
              }
            />

            <label
              className="mt-4 block text-sm font-semibold"
              htmlFor="reference-description"
            >
              설명
            </label>
            <textarea
              id="reference-description"
              value={referenceDraft.description}
              maxLength={500}
              disabled={isSubmitting}
              className={`${textareaClassName} mt-2`}
              onChange={(event) =>
                setReferenceDraft((current) => ({
                  ...current,
                  description: event.currentTarget.value,
                }))
              }
            />

            <div className="mt-4 flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                <Check data-icon="inline-start" />
                {isSubmitting ? "저장 중" : "저장"}
              </Button>
              {editingReferenceId && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={clearReferenceForm}
                >
                  <RotateCcw data-icon="inline-start" />
                  취소
                </Button>
              )}
            </div>
          </form>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Database className="size-5 text-neutral-500" />
                <h2 className="text-lg font-bold">
                  {referenceTabs.find((tab) => tab.value === activeTab)?.label} 목록
                </h2>
              </div>
              <span className="text-sm text-neutral-500">
                {activeReferences.length}개
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              현재 백엔드 계약은 기준정보 생성과 수정만 제공합니다.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {activeReferences.map((reference) => (
                <div
                  key={reference.id}
                  className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{reference.name}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {reference.code} · ID {reference.id}
                    </p>
                    {reference.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-neutral-600">
                        {reference.description}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startReferenceEditing(reference)}
                  >
                    <Pencil data-icon="inline-start" />
                    수정
                  </Button>
                </div>
              ))}
            </div>
            {activeReferences.length === 0 && (
              <p className="mt-5 text-sm text-neutral-600">
                등록된 기준정보가 없습니다.
              </p>
            )}
          </div>
        </section>
      )}
    </section>
  )
}

function getAdminErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return error instanceof Error
    ? error.message
    : "관리자 요청을 처리하지 못했습니다."
}
