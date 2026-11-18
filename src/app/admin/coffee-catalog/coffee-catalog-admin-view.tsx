"use client"

import {
  Bean,
  Check,
  Database,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react"
import { Tabs } from "radix-ui"
import { type FormEvent, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { sameFormValues, useUnsavedChanges } from "@/components/unsaved-changes-provider"
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
import { useFormErrorFocus } from "@/lib/form-feedback"
import { ApiError, validationErrorsToFieldMap } from "@/lib/api/types"
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
  const focusFormError = useFormErrorFocus()
  const sectionRef = useRef<HTMLElement>(null)
  const [referenceErrors, setReferenceErrors] = useState<Partial<ReferenceDraft>>({})
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
  const [savedReference, setSavedReference] = useState<ReferenceDraft>(emptyReferenceDraft)
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
  const profileRequest = useRef(0)
  const busy = isSubmitting || pendingProfileId !== null
  const guard = useUnsavedChanges("coffee-catalog", "커피 기준정보", !sameFormValues(referenceDraft, savedReference), busy)

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
      profileRequest.current += 1
    }
  }, [])

  function showError(error: unknown) {
    setMessageTone("error")
    setMessage(getAdminErrorMessage(error))
  }

  async function selectTab(tab: CatalogTab) {
    if (tab === activeTab || !(await guard.confirmDiscard())) return
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
    if (profileEditor?.profile?.id === profile.id || !(await guard.confirmDiscard())) return
    const request = ++profileRequest.current
    setPendingProfileId(profile.id)
    setMessage(null)

    try {
      const latestProfile = await getAdminCoffeeProfile(profile.id)
      if (request !== profileRequest.current) return
      setProfileEditor({ key: `edit-${latestProfile.id}`, profile: latestProfile })
    } catch (error) {
      if (request === profileRequest.current) showError(error)
    } finally {
      if (request === profileRequest.current) setPendingProfileId(null)
    }
  }

  async function saveProfile(payload: CoffeeProfileRequest) {
    setIsSubmitting(true)
    try {
      if (profileEditor?.profile) {
        await updateAdminCoffeeProfile(profileEditor.profile.id, payload)
      } else {
        await createAdminCoffeeProfile(payload)
      }

      setProfileEditor(null)
      setMessageTone("success")
      setMessage("커피 프로필을 저장했습니다.")
      try { await refreshProfiles() } catch {
        setMessageTone("error")
        setMessage("커피 프로필을 저장했지만 목록을 불러오지 못했습니다. 화면을 새로고침해 주세요.")
      }
    } finally { setIsSubmitting(false) }
  }

  async function startReferenceEditing(reference: CoffeeReference) {
    if (editingReferenceId === reference.id || !(await guard.confirmDiscard())) return
    setReferenceErrors({})
    setEditingReferenceId(reference.id)
    const draft = {
      code: reference.code,
      name: reference.name,
      description: reference.description ?? "",
    }
    setReferenceDraft(draft)
    setSavedReference(draft)
    setMessage(null)
  }

  function clearReferenceForm() {
    setReferenceErrors({})
    setEditingReferenceId(null)
    setReferenceDraft(emptyReferenceDraft)
    setSavedReference(emptyReferenceDraft)
  }

  async function saveReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (activeTab === "profiles" || busy) {
      return
    }

    const code = referenceDraft.code.trim().toUpperCase()
    const name = referenceDraft.name.trim()

    const nextErrors: Partial<ReferenceDraft> = {}
    if (!editingReferenceId && !code) nextErrors.code = "코드를 입력해 주세요."
    if (!name) nextErrors.name = "이름을 입력해 주세요."
    setReferenceErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setMessage(null)
      focusFormError(sectionRef.current)
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

      clearReferenceForm()
      setMessageTone("success")
      setMessage("기준정보를 저장했습니다.")
      try { await refreshReferences(activeTab) } catch {
        setMessageTone("error")
        setMessage("기준정보를 저장했지만 목록을 불러오지 못했습니다. 화면을 새로고침해 주세요.")
      }
    } catch (error) {
      if (error instanceof ApiError) setReferenceErrors(validationErrorsToFieldMap(error.errors))
      showError(error)
      focusFormError(sectionRef.current)
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeReferences =
    activeTab === "profiles" ? [] : references[activeTab]

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(value) => void selectTab(value as CatalogTab)}
      activationMode="manual"
      asChild
    >
      <section ref={sectionRef} className="flex min-w-0 flex-col gap-5">
        <Tabs.List className="flex gap-2 overflow-x-auto p-1.5" aria-label="커피 카탈로그 관리 항목">
          {[{ value: "profiles", label: "커피 프로필" }, ...referenceTabs].map((tab) => (
            <Tabs.Trigger key={tab.value} value={tab.value} asChild>
              <Button
                type="button"
                className="catalog-tab"
                disabled={busy}
                variant={activeTab === tab.value ? "default" : "outline"}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    // 확인창으로 옮긴 초점에 같은 키의 기본 클릭이 이어지지 않게 한다.
                    event.preventDefault()
                    void selectTab(tab.value as CatalogTab)
                  }
                }}
              >
                {tab.value === "profiles" && <Bean data-icon="inline-start" />}
                {tab.label}
              </Button>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content key={activeTab} value={activeTab} className="flex min-w-0 flex-col gap-5">
          {message && (
            <p
              className={
                messageTone === "success"
                  ? "rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700"
                  : "rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
              }
              tabIndex={-1}
              data-form-error={messageTone === "error" ? true : undefined}
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
                  disabled={busy}
                />
              ) : (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={busy}
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
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
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
                          aria-label={`${profile.profileName} 프로필 ${pendingProfileId === profile.id ? "불러오는 중" : "수정"}`}
                          aria-busy={pendingProfileId === profile.id}
                          disabled={busy}
                          onClick={() => void startProfileEditing(profile)}
                        >
                          <Pencil data-icon="inline-start" />
                          {pendingProfileId === profile.id ? "불러오는 중" : "수정"}
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
                noValidate
                aria-label="기준정보 편집"
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
                  name="code"
                  required
                  aria-invalid={Boolean(referenceErrors.code)}
                  aria-describedby={referenceErrors.code ? "reference-code-error" : undefined}
                  value={referenceDraft.code}
                  maxLength={50}
                  disabled={isSubmitting || editingReferenceId !== null}
                  className={`${inputClassName} mt-2 uppercase`}
                  placeholder="예: WASHED"
                  onChange={(event) => {
                    const { value } = event.currentTarget
                    setReferenceErrors((current) => ({ ...current, code: undefined }))
                    setMessage(null)
                    setReferenceDraft((current) => ({
                      ...current,
                      code: value,
                    }))
                  }}
                />
                {referenceErrors.code && <p id="reference-code-error" className="mt-2 text-xs font-medium text-red-600">{referenceErrors.code}</p>}

                <label className="mt-4 block text-sm font-semibold" htmlFor="reference-name">
                  이름
                </label>
                <input
                  id="reference-name"
                  name="name"
                  required
                  aria-invalid={Boolean(referenceErrors.name)}
                  aria-describedby={referenceErrors.name ? "reference-name-error" : undefined}
                  value={referenceDraft.name}
                  maxLength={100}
                  disabled={isSubmitting}
                  className={`${inputClassName} mt-2`}
                  onChange={(event) => {
                    const { value } = event.currentTarget
                    setReferenceErrors((current) => ({ ...current, name: undefined }))
                    setMessage(null)
                    setReferenceDraft((current) => ({
                      ...current,
                      name: value,
                    }))
                  }}
                />
                {referenceErrors.name && <p id="reference-name-error" className="mt-2 text-xs font-medium text-red-600">{referenceErrors.name}</p>}

                <label
                  className="mt-4 block text-sm font-semibold"
                  htmlFor="reference-description"
                >
                  설명
                </label>
                <textarea
                  id="reference-description"
                  name="description"
                  aria-invalid={Boolean(referenceErrors.description)}
                  aria-describedby={referenceErrors.description ? "reference-description-error" : undefined}
                  value={referenceDraft.description}
                  maxLength={500}
                  disabled={isSubmitting}
                  className={`${textareaClassName} mt-2`}
                  onChange={(event) => {
                    const { value } = event.currentTarget
                    setReferenceErrors((current) => ({ ...current, description: undefined }))
                    setMessage(null)
                    setReferenceDraft((current) => ({
                      ...current,
                      description: value,
                    }))
                  }}
                />
                {referenceErrors.description && <p id="reference-description-error" className="mt-2 text-xs font-medium text-red-600">{referenceErrors.description}</p>}

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
                      onClick={async () => { if (await guard.confirmDiscard()) clearReferenceForm() }}
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
                  기준정보를 추가하거나 수정할 수 있습니다. 삭제는 지원하지 않습니다.
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
                        aria-label={`${reference.name} (${reference.code}) 기준정보 수정`}
                        disabled={busy}
                        onClick={() => void startReferenceEditing(reference)}
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
        </Tabs.Content>
      </section>
    </Tabs.Root>
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
