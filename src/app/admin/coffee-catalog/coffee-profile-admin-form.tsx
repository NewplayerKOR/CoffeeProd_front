"use client"

import { Check, Plus, Trash2, X } from "lucide-react"
import { type FormEvent, type ReactNode, useState } from "react"

import { useFormErrorFocus, getNumberInputErrors } from "@/lib/form-feedback"
import { ApiError, validationErrorsToFieldMap } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { sameFormValues, useUnsavedChanges } from "@/components/unsaved-changes-provider"
import type {
  BeanType,
  CoffeeProfile,
  CoffeeProfileRequest,
  CoffeeReference,
} from "@/lib/api/coffee"
import type { RoastLevel } from "@/lib/api/catalog"

type ProfileFormState = {
  processingMethodId: string
  profileName: string
  beanType: BeanType
  originCountryCode: string
  originRegion: string
  farmOrCooperative: string
  producer: string
  altitudeMin: string
  altitudeMax: string
  roastLevel: RoastLevel
  decaf: boolean
  decafMethod: string
  acidity: string
  body: string
  sweetness: string
  aroma: string
  summary: string
  flavorNotes: Array<{ flavorNoteId: number; intensity: string }>
  brewMethods: Array<{ brewMethodId: number; recommendationNote: string }>
  varieties: Array<{ coffeeVarietyId: number }>
  components: Array<{
    originCountryCode: string
    originRegion: string
    processingMethodId: string
    componentRatio: string
  }>
}

const emptyForm: ProfileFormState = {
  processingMethodId: "",
  profileName: "",
  beanType: "SINGLE_ORIGIN",
  originCountryCode: "",
  originRegion: "",
  farmOrCooperative: "",
  producer: "",
  altitudeMin: "",
  altitudeMax: "",
  roastLevel: "MEDIUM",
  decaf: false,
  decafMethod: "",
  acidity: "3",
  body: "3",
  sweetness: "3",
  aroma: "3",
  summary: "",
  flavorNotes: [],
  brewMethods: [],
  varieties: [],
  components: [],
}

const inputClassName =
  "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors focus:border-neutral-950 disabled:bg-neutral-100"
const textareaClassName =
  "min-h-24 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-neutral-950 disabled:bg-neutral-100"

export function CoffeeProfileAdminForm({
  profile,
  processingMethods,
  flavorNotes,
  brewMethods,
  varieties,
  onSave,
  onCancel,
  disabled = false,
}: {
  profile: CoffeeProfile | null
  processingMethods: CoffeeReference[]
  flavorNotes: CoffeeReference[]
  brewMethods: CoffeeReference[]
  varieties: CoffeeReference[]
  onSave: (payload: CoffeeProfileRequest) => Promise<void>
  onCancel: () => void
  disabled?: boolean
}) {
  const focusFormError = useFormErrorFocus()
  const [initialForm] = useState<ProfileFormState>(() =>
    profile ? toFormState(profile) : emptyForm
  )
  const [form, setForm] = useState<ProfileFormState>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const isSubmitting = isSaving || disabled
  const guard = useUnsavedChanges("coffee-catalog", "커피 프로필", !sameFormValues(form, initialForm), isSubmitting)

  async function cancel() {
    if (await guard.confirmDiscard()) onCancel()
  }

  function updateField<Key extends keyof ProfileFormState>(
    field: Key,
    value: ProfileFormState[Key]
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([name]) => name !== field && !name.startsWith(`${field}[`))))
    setMessage(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    const formElement = event.currentTarget
    const nextErrors = {
      ...getNumberInputErrors(event.currentTarget),
      ...validateProfileForm(form),
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setMessage(null)
      focusFormError(formElement)
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await onSave(toRequest(form))
      guard.markSaved()
    } catch (error) {
      if (error instanceof ApiError) setErrors(validationErrorsToFieldMap(error.errors))
      focusFormError(formElement)
      setMessage(error instanceof Error ? error.message : "프로필 저장에 실패했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  function toggleFlavorNote(flavorNoteId: number) {
    const exists = form.flavorNotes.some(
      (item) => item.flavorNoteId === flavorNoteId
    )

    updateField(
      "flavorNotes",
      exists
        ? form.flavorNotes.filter((item) => item.flavorNoteId !== flavorNoteId)
        : [...form.flavorNotes, { flavorNoteId, intensity: "3" }]
    )
  }

  function toggleBrewMethod(brewMethodId: number) {
    const exists = form.brewMethods.some(
      (item) => item.brewMethodId === brewMethodId
    )

    updateField(
      "brewMethods",
      exists
        ? form.brewMethods.filter((item) => item.brewMethodId !== brewMethodId)
        : [...form.brewMethods, { brewMethodId, recommendationNote: "" }]
    )
  }

  function toggleVariety(coffeeVarietyId: number) {
    const exists = form.varieties.some(
      (item) => item.coffeeVarietyId === coffeeVarietyId
    )

    updateField(
      "varieties",
      exists
        ? form.varieties.filter(
            (item) => item.coffeeVarietyId !== coffeeVarietyId
          )
        : [...form.varieties, { coffeeVarietyId }]
    )
  }

  return (
    <form
      className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
      noValidate
      aria-label={profile ? "커피 프로필 수정" : "커피 프로필 등록"}
      onSubmit={handleSubmit}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">
            {profile ? "커피 프로필 수정" : "커피 프로필 등록"}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            배열의 선택 순서가 향미·추출법·품종 노출 순서로 저장됩니다.
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" disabled={isSubmitting} onClick={() => void cancel()}>
          <X />
          <span className="sr-only">닫기</span>
        </Button>
      </div>

      {message && (
        <p data-form-error tabIndex={-1} className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
          {message}
        </p>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <TextField
          name="profileName"
          error={errors.profileName}
          required
          label="프로필명"
          value={form.profileName}
          disabled={isSubmitting}
          onChange={(value) => updateField("profileName", value)}
        />
        <SelectField
          name="beanType"
          error={errors.beanType}
          label="원두 구성"
          value={form.beanType}
          disabled={isSubmitting}
          onChange={(value) =>
            updateField("beanType", value as BeanType)
          }
        >
          <option value="SINGLE_ORIGIN">싱글 오리진</option>
          <option value="BLEND">블렌드</option>
        </SelectField>
        <SelectField
          name="processingMethodId"
          error={errors.processingMethodId}
          label="대표 가공 방식"
          value={form.processingMethodId}
          disabled={isSubmitting}
          onChange={(value) => updateField("processingMethodId", value)}
        >
          <option value="">미지정</option>
          {processingMethods.map((method) => (
            <option key={method.id} value={String(method.id)}>
              {method.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          name="roastLevel"
          error={errors.roastLevel}
          label="로스팅"
          value={form.roastLevel}
          disabled={isSubmitting}
          onChange={(value) =>
            updateField("roastLevel", value as RoastLevel)
          }
        >
          <option value="LIGHT">라이트</option>
          <option value="MEDIUM">미디엄</option>
          <option value="DARK">다크</option>
        </SelectField>
      </section>

      {form.beanType === "SINGLE_ORIGIN" ? (
        <section className="mt-6 grid gap-4 border-t border-neutral-200 pt-6 md:grid-cols-2">
          <TextField
            name="originCountryCode"
            error={errors.originCountryCode}
            required
            label="원산지 국가 코드"
            value={form.originCountryCode}
            maxLength={2}
            disabled={isSubmitting}
            placeholder="ET"
            onChange={(value) =>
              updateField("originCountryCode", value.toUpperCase())
            }
          />
          <TextField
            name="originRegion"
            error={errors.originRegion}
            label="원산지 지역"
            value={form.originRegion}
            disabled={isSubmitting}
            onChange={(value) => updateField("originRegion", value)}
          />
          <TextField
            name="farmOrCooperative"
            error={errors.farmOrCooperative}
            label="농장 또는 조합"
            value={form.farmOrCooperative}
            disabled={isSubmitting}
            onChange={(value) => updateField("farmOrCooperative", value)}
          />
          <TextField
            name="producer"
            error={errors.producer}
            label="생산자"
            value={form.producer}
            disabled={isSubmitting}
            onChange={(value) => updateField("producer", value)}
          />
          <TextField
            name="altitudeMin"
            error={errors.altitudeMin}
            label="최저 고도(m)"
            value={form.altitudeMin}
            type="number"
            min={0}
            disabled={isSubmitting}
            onChange={(value) => updateField("altitudeMin", value)}
          />
          <TextField
            name="altitudeMax"
            error={errors.altitudeMax}
            label="최고 고도(m)"
            value={form.altitudeMax}
            type="number"
            min={0}
            disabled={isSubmitting}
            onChange={(value) => updateField("altitudeMax", value)}
          />
        </section>
      ) : (
        <BlendComponents
          components={form.components}
          processingMethods={processingMethods}
          disabled={isSubmitting}
          errors={errors}
          onChange={(components) => updateField("components", components)}
        />
      )}

      <section className="mt-6 border-t border-neutral-200 pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              {...profileFieldProps("decaf", errors)}
              type="checkbox"
              checked={form.decaf}
              disabled={isSubmitting}
              className="size-4"
              onChange={(event) => updateField("decaf", event.currentTarget.checked)}
            />
            디카페인 프로필
          </label>
          <ProfileFieldError name="decaf" error={errors.decaf} />
          {form.decaf && (
            <div className="w-full max-w-xs">
              <label htmlFor="profile-decafMethod" className="mb-2 block text-sm font-semibold">
                디카페인 방식
              </label>
              <input
                {...profileFieldProps("decafMethod", errors)}
                value={form.decafMethod}
                maxLength={50}
                disabled={isSubmitting}
                className={`${inputClassName} max-w-xs`}
                placeholder="디카페인 방식"
                onChange={(event) => updateField("decafMethod", event.currentTarget.value)}
              />
              <ProfileFieldError name="decafMethod" error={errors.decafMethod} />
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 border-t border-neutral-200 pt-6">
        <h3 className="text-sm font-bold">감각 점수</h3>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {(
            [
              ["acidity", "산미"],
              ["body", "바디"],
              ["sweetness", "단맛"],
              ["aroma", "향"],
            ] as const
          ).map(([field, label]) => (
            <SelectField
              key={field}
              name={field}
              error={errors[field]}
              label={label}
              value={form[field]}
              disabled={isSubmitting}
              onChange={(value) => updateField(field, value)}
            >
              {[1, 2, 3, 4, 5].map((score) => (
                <option key={score} value={String(score)}>
                  {score} / 5
                </option>
              ))}
            </SelectField>
          ))}
        </div>
      </section>

      <ReferenceSelection
        name="flavorNotes"
        errors={errors}
        title="향미 노트"
        description="최대 5개"
        references={flavorNotes}
        selectedIds={form.flavorNotes.map((item) => item.flavorNoteId)}
        limit={5}
        disabled={isSubmitting}
        onToggle={toggleFlavorNote}
        renderExtra={(reference) => {
          const selected = form.flavorNotes.find(
            (item) => item.flavorNoteId === reference.id
          )

          return selected ? (
            <div>
              <label
                htmlFor={`profile-flavor-${reference.id}-intensity`}
                className="mt-2 block text-xs font-semibold"
              >
                {reference.name} 강도
              </label>
              <select
                {...profileFieldProps(
                  `flavorNotes[${form.flavorNotes.indexOf(selected)}].intensity`,
                  errors
                )}
                id={`profile-flavor-${reference.id}-intensity`}
                value={selected.intensity}
                disabled={isSubmitting}
                className={`${inputClassName} mt-2`}
                onChange={(event) =>
                  updateField(
                    "flavorNotes",
                    form.flavorNotes.map((item) =>
                      item.flavorNoteId === reference.id
                        ? { ...item, intensity: event.currentTarget.value }
                        : item
                    )
                  )
                }
              >
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={String(score)}>
                    강도 {score}
                  </option>
                ))}
              </select>
              <ProfileFieldError
                name={`flavorNotes[${form.flavorNotes.indexOf(selected)}].intensity`}
                error={errors[`flavorNotes[${form.flavorNotes.indexOf(selected)}].intensity`]}
              />
            </div>
          ) : null
        }}
      />

      <ReferenceSelection
        name="brewMethods"
        errors={errors}
        title="추천 추출법"
        description="최대 3개"
        references={brewMethods}
        selectedIds={form.brewMethods.map((item) => item.brewMethodId)}
        limit={3}
        disabled={isSubmitting}
        onToggle={toggleBrewMethod}
        renderExtra={(reference) => {
          const selected = form.brewMethods.find(
            (item) => item.brewMethodId === reference.id
          )

          return selected ? (
            <div>
              <label
                htmlFor={`profile-brew-${reference.id}-note`}
                className="mt-2 block text-xs font-semibold"
              >
                {reference.name} 추출 안내
              </label>
              <input
                {...profileFieldProps(
                  `brewMethods[${form.brewMethods.indexOf(selected)}].recommendationNote`,
                  errors
                )}
                id={`profile-brew-${reference.id}-note`}
                value={selected.recommendationNote}
                maxLength={500}
                disabled={isSubmitting}
                className={`${inputClassName} mt-2`}
                placeholder="추출 안내"
                onChange={(event) =>
                  updateField(
                    "brewMethods",
                    form.brewMethods.map((item) =>
                      item.brewMethodId === reference.id
                        ? { ...item, recommendationNote: event.currentTarget.value }
                        : item
                    )
                  )
                }
              />
              <ProfileFieldError
                name={`brewMethods[${form.brewMethods.indexOf(selected)}].recommendationNote`}
                error={
                  errors[`brewMethods[${form.brewMethods.indexOf(selected)}].recommendationNote`]
                }
              />
            </div>
          ) : null
        }}
      />

      <ReferenceSelection
        name="varieties"
        errors={errors}
        title="커피 품종"
        description="최대 3개"
        references={varieties}
        selectedIds={form.varieties.map((item) => item.coffeeVarietyId)}
        limit={3}
        disabled={isSubmitting}
        onToggle={toggleVariety}
      />

      <div className="mt-6 block border-t border-neutral-200 pt-6">
        <label htmlFor="profile-summary" className="mb-2 block text-sm font-semibold">프로필 요약</label>
        <textarea
          {...profileFieldProps("summary", errors)}
          value={form.summary}
          disabled={isSubmitting}
          className={textareaClassName}
          onChange={(event) => updateField("summary", event.currentTarget.value)}
        />
        <ProfileFieldError name="summary" error={errors.summary} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          <Check data-icon="inline-start" />
          {isSubmitting ? "저장 중" : profile ? "수정 저장" : "프로필 등록"}
        </Button>
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => void cancel()}>
          취소
        </Button>
      </div>
    </form>
  )
}

function BlendComponents({
  components,
  processingMethods,
  disabled,
  errors,
  onChange,
}: {
  errors: Record<string, string>
  components: ProfileFormState["components"]
  processingMethods: CoffeeReference[]
  disabled: boolean
  onChange: (components: ProfileFormState["components"]) => void
}) {
  function updateComponent(
    index: number,
    field: keyof ProfileFormState["components"][number],
    value: string
  ) {
    onChange(
      components.map((component, componentIndex) =>
        componentIndex === index ? { ...component, [field]: value } : component
      )
    )
  }

  return (
    <section className="mt-6 border-t border-neutral-200 pt-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold">블렌드 구성요소</h3>
          <p id="profile-components-hint" className="mt-1 text-xs text-neutral-500">
            2~5개 구성, 비율 입력 시 합계 100
          </p>
        </div>
        <Button
          {...profileFieldProps("components", errors, "profile-components-hint")}
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || components.length >= 5}
          onClick={() =>
            onChange([
              ...components,
              {
                originCountryCode: "",
                originRegion: "",
                processingMethodId: "",
                componentRatio: "",
              },
            ])
          }
        >
          <Plus data-icon="inline-start" /> 추가
        </Button>
      </div>

      <ProfileFieldError name="components" error={errors.components} />
      <div className="mt-4 space-y-3">
        {components.map((component, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-[120px_1fr_1fr_120px_auto]"
          >
            <div>
              <label
                htmlFor={`profile-components[${index}].originCountryCode`}
                className="mb-2 block text-xs font-semibold"
              >
                구성 {index + 1} 국가 코드
              </label>
              <input
                {...profileFieldProps(`components[${index}].originCountryCode`, errors)}
                value={component.originCountryCode}
                maxLength={2}
                disabled={disabled}
                className={inputClassName}
                placeholder="국가 코드"
                onChange={(event) =>
                  updateComponent(index, "originCountryCode", event.currentTarget.value.toUpperCase())
                }
              />
              <ProfileFieldError
                name={`components[${index}].originCountryCode`}
                error={errors[`components[${index}].originCountryCode`]}
              />
            </div>
            <div>
              <label
                htmlFor={`profile-components[${index}].originRegion`}
                className="mb-2 block text-xs font-semibold"
              >
                구성 {index + 1} 지역
              </label>
              <input
                {...profileFieldProps(`components[${index}].originRegion`, errors)}
                value={component.originRegion}
                disabled={disabled}
                className={inputClassName}
                placeholder="지역"
                onChange={(event) =>
                  updateComponent(index, "originRegion", event.currentTarget.value)
                }
              />
              <ProfileFieldError
                name={`components[${index}].originRegion`}
                error={errors[`components[${index}].originRegion`]}
              />
            </div>
            <div>
              <label
                htmlFor={`profile-components[${index}].processingMethodId`}
                className="mb-2 block text-xs font-semibold"
              >
                구성 {index + 1} 가공 방식
              </label>
              <select
                {...profileFieldProps(`components[${index}].processingMethodId`, errors)}
                value={component.processingMethodId}
                disabled={disabled}
                className={inputClassName}
                onChange={(event) =>
                  updateComponent(index, "processingMethodId", event.currentTarget.value)
                }
              >
                <option value="">가공 방식 미지정</option>
                {processingMethods.map((method) => (
                  <option key={method.id} value={String(method.id)}>
                    {method.name}
                  </option>
                ))}
              </select>
              <ProfileFieldError
                name={`components[${index}].processingMethodId`}
                error={errors[`components[${index}].processingMethodId`]}
              />
            </div>
            <div>
              <label
                htmlFor={`profile-components[${index}].componentRatio`}
                className="mb-2 block text-xs font-semibold"
              >
                구성 {index + 1} 비율 %
              </label>
              <input
                {...profileFieldProps(`components[${index}].componentRatio`, errors, "profile-components-hint")}
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                value={component.componentRatio}
                disabled={disabled}
                className={inputClassName}
                placeholder="비율 %"
                onChange={(event) =>
                  updateComponent(index, "componentRatio", event.currentTarget.value)
                }
              />
              <ProfileFieldError
                name={`components[${index}].componentRatio`}
                error={errors[`components[${index}].componentRatio`]}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() =>
                onChange(components.filter((_, componentIndex) => componentIndex !== index))
              }
            >
              <Trash2 />
              <span className="sr-only">구성요소 삭제</span>
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}

function ReferenceSelection({
  name,
  errors,
  title,
  description,
  references,
  selectedIds,
  limit,
  disabled,
  onToggle,
  renderExtra,
}: {
  name: "flavorNotes" | "brewMethods" | "varieties"
  errors: Record<string, string>
  title: string
  description: string
  references: CoffeeReference[]
  selectedIds: number[]
  limit: number
  disabled: boolean
  onToggle: (id: number) => void
  renderExtra?: (reference: CoffeeReference) => ReactNode
}) {
  return (
    <section
      id={`profile-${name}`}
      role="group"
      tabIndex={-1}
      aria-labelledby={`profile-${name}-title`}
      data-invalid={Boolean(errors[name])}
      aria-describedby={[`profile-${name}-hint`, errors[name] ? `profile-${name}-error` : undefined].filter(Boolean).join(" ")}
      className="mt-6 border-t border-neutral-200 pt-6"
    >
      <div className="flex items-center gap-2">
        <h3 id={`profile-${name}-title`} className="text-sm font-bold">{title}</h3>
        <span id={`profile-${name}-hint`} className="text-xs text-neutral-500">{description}</span>
      </div>
      <ProfileFieldError name={name} error={errors[name]} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {references.map((reference) => {
          const selected = selectedIds.includes(reference.id)
          const idField = name === "flavorNotes" ? "flavorNoteId" : name === "brewMethods" ? "brewMethodId" : "coffeeVarietyId"
          const field = selected ? `${name}[${selectedIds.indexOf(reference.id)}].${idField}` : `${name}-option-${reference.id}`
          const blocked = !selected && selectedIds.length >= limit

          return (
            <div
              key={reference.id}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"
            >
              <label htmlFor={`profile-${name}-option-${reference.id}`} className="flex items-start gap-2 text-sm">
                <input
                  {...profileFieldProps(field, errors, `profile-${name}-hint`)}
                  id={`profile-${name}-option-${reference.id}`}
                  type="checkbox"
                  checked={selected}
                  disabled={disabled || blocked}
                  className="mt-0.5 size-4"
                  onChange={() => onToggle(reference.id)}
                />
                <span>
                  <strong className="block">{reference.name}</strong>
                  <span className="mt-1 block text-xs text-neutral-500">
                    {reference.code}
                  </span>
                </span>
              </label>
              <ProfileFieldError name={field} error={errors[field]} />
              {renderExtra?.(reference)}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TextField({
  name,
  error,
  required = false,
  label,
  value,
  disabled,
  placeholder,
  type = "text",
  min,
  maxLength,
  onChange,
}: {
  name: string
  error?: string
  required?: boolean
  label: string
  value: string
  disabled: boolean
  placeholder?: string
  type?: "text" | "number"
  min?: number
  maxLength?: number
  onChange: (value: string) => void
}) {
  return (
    <div className="block">
      <label htmlFor={`profile-${name}`} className="mb-2 block text-sm font-semibold">{label}</label>
      <input
        {...profileFieldProps(name, { [name]: error })}
        required={required}
        type={type}
        min={min}
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        className={inputClassName}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <ProfileFieldError name={name} error={error} />
    </div>
  )
}

function SelectField({
  name,
  error,
  required = false,
  label,
  value,
  disabled,
  children,
  onChange,
}: {
  name: string
  error?: string
  required?: boolean
  label: string
  value: string
  disabled: boolean
  children: ReactNode
  onChange: (value: string) => void
}) {
  return (
    <div className="block">
      <label htmlFor={`profile-${name}`} className="mb-2 block text-sm font-semibold">{label}</label>
      <select
        {...profileFieldProps(name, { [name]: error })}
        required={required}
        value={value}
        disabled={disabled}
        className={inputClassName}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {children}
      </select>
      <ProfileFieldError name={name} error={error} />
    </div>
  )
}

function profileFieldProps(
  name: string,
  errors: Record<string, string | undefined>,
  hintId?: string
) {
  return {
    id: `profile-${name}`,
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": [hintId, errors[name] ? `profile-${name}-error` : undefined].filter(Boolean).join(" ") || undefined,
  }
}

function ProfileFieldError({ name, error }: { name: string; error?: string }) {
  return error ? (
    <p id={`profile-${name}-error`} className="mt-2 text-xs font-medium text-red-600">
      {error}
    </p>
  ) : null
}

function validateProfileForm(form: ProfileFormState) {
  const errors: Record<string, string> = {}
  if (!form.profileName.trim()) errors.profileName = "프로필명을 입력해 주세요."
  if (form.beanType === "SINGLE_ORIGIN") {
    if (!/^[A-Z]{2}$/.test(form.originCountryCode))
      errors.originCountryCode = "싱글 오리진 국가 코드는 영문 대문자 2자리여야 합니다."
    for (const name of ["altitudeMin", "altitudeMax"] as const) {
      if (
        form[name] !== "" &&
        (!Number.isInteger(Number(form[name])) || Number(form[name]) < 0)
      )
        errors[name] = "고도는 0 이상의 정수로 입력해 주세요."
    }
    if (
      form.altitudeMin !== "" &&
      form.altitudeMax !== "" &&
      Number(form.altitudeMin) > Number(form.altitudeMax)
    )
      errors.altitudeMin = "최저 고도는 최고 고도보다 클 수 없습니다."
  } else {
    if (form.components.length < 2 || form.components.length > 5)
      errors.components = "블렌드는 2~5개 구성요소가 필요합니다."
    const enteredRatios = form.components.filter(
      (component) => component.componentRatio !== ""
    )
    const incomplete =
      enteredRatios.length > 0 && enteredRatios.length !== form.components.length
    const totalInvalid =
      enteredRatios.length > 0 &&
      Math.abs(
        enteredRatios.reduce(
          (sum, component) => sum + Number(component.componentRatio),
          0
        ) - 100
      ) > 0.001
    form.components.forEach((component, index) => {
      if (!/^[A-Z]{2}$/.test(component.originCountryCode))
        errors[`components[${index}].originCountryCode`] =
          "국가 코드는 영문 대문자 2자리로 입력해 주세요."
      const ratio = Number(component.componentRatio)
      if (
        component.componentRatio !== "" &&
        (!Number.isFinite(ratio) ||
          ratio < 0.01 ||
          ratio > 100 ||
          Math.abs(ratio * 100 - Math.round(ratio * 100)) > 0.000001)
      )
        errors[`components[${index}].componentRatio`] =
          "비율은 0.01~100 사이에서 소수점 둘째 자리까지 입력해 주세요."
      else if (incomplete)
        errors[`components[${index}].componentRatio`] =
          "블렌드 비율은 모두 입력하거나 모두 비워야 합니다."
      else if (totalInvalid)
        errors[`components[${index}].componentRatio`] =
          "블렌드 구성 비율의 합계는 100이어야 합니다."
    })
  }
  return errors
}

function toRequest(form: ProfileFormState): CoffeeProfileRequest {
  const isSingleOrigin = form.beanType === "SINGLE_ORIGIN"

  return {
    processingMethodId: numberOrNull(form.processingMethodId),
    profileName: form.profileName.trim(),
    beanType: form.beanType,
    originCountryCode: isSingleOrigin ? form.originCountryCode : null,
    originRegion: isSingleOrigin ? blankToNull(form.originRegion) : null,
    farmOrCooperative: isSingleOrigin
      ? blankToNull(form.farmOrCooperative)
      : null,
    producer: isSingleOrigin ? blankToNull(form.producer) : null,
    altitudeMin: isSingleOrigin ? numberOrNull(form.altitudeMin) : null,
    altitudeMax: isSingleOrigin ? numberOrNull(form.altitudeMax) : null,
    roastLevel: form.roastLevel,
    decaf: form.decaf,
    decafMethod: form.decaf ? blankToNull(form.decafMethod) : null,
    acidity: Number(form.acidity),
    body: Number(form.body),
    sweetness: Number(form.sweetness),
    aroma: Number(form.aroma),
    summary: blankToNull(form.summary),
    flavorNotes: form.flavorNotes.map((item) => ({
      flavorNoteId: item.flavorNoteId,
      intensity: Number(item.intensity),
    })),
    brewMethods: form.brewMethods.map((item) => ({
      brewMethodId: item.brewMethodId,
      recommendationNote: blankToNull(item.recommendationNote),
    })),
    varieties: form.varieties,
    components: isSingleOrigin
      ? []
      : form.components.map((component) => ({
          originCountryCode: component.originCountryCode,
          originRegion: blankToNull(component.originRegion),
          processingMethodId: numberOrNull(component.processingMethodId),
          componentRatio: numberOrNull(component.componentRatio),
        })),
  }
}

function toFormState(profile: CoffeeProfile): ProfileFormState {
  return {
    processingMethodId: profile.processingMethod
      ? String(profile.processingMethod.id)
      : "",
    profileName: profile.profileName,
    beanType: profile.beanType,
    originCountryCode: profile.originCountryCode ?? "",
    originRegion: profile.originRegion ?? "",
    farmOrCooperative: profile.farmOrCooperative ?? "",
    producer: profile.producer ?? "",
    altitudeMin: profile.altitudeMin === null ? "" : String(profile.altitudeMin),
    altitudeMax: profile.altitudeMax === null ? "" : String(profile.altitudeMax),
    roastLevel: profile.roastLevel,
    decaf: profile.decaf,
    decafMethod: profile.decafMethod ?? "",
    acidity: String(profile.acidity),
    body: String(profile.body),
    sweetness: String(profile.sweetness),
    aroma: String(profile.aroma),
    summary: profile.summary ?? "",
    flavorNotes: profile.flavorNotes.map((item) => ({
      flavorNoteId: item.flavorNoteId,
      intensity: String(item.intensity),
    })),
    brewMethods: profile.brewMethods.map((item) => ({
      brewMethodId: item.brewMethodId,
      recommendationNote: item.recommendationNote ?? "",
    })),
    varieties: profile.varieties.map((item) => ({
      coffeeVarietyId: item.coffeeVarietyId,
    })),
    components: profile.components.map((item) => ({
      originCountryCode: item.originCountryCode,
      originRegion: item.originRegion ?? "",
      processingMethodId: item.processingMethod
        ? String(item.processingMethod.id)
        : "",
      componentRatio:
        item.componentRatio === null ? "" : String(item.componentRatio),
    })),
  }
}

function blankToNull(value: string) {
  const normalized = value.trim()
  return normalized || null
}

function numberOrNull(value: string) {
  return value === "" ? null : Number(value)
}
