"use client"

import type { ChangeEvent, ReactNode } from "react"

import type { RoastLevel } from "@/lib/api/catalog"
import type { BeanType, CoffeeReference } from "@/lib/api/coffee"

export type CoffeePreferenceFormState = {
  roastLevel: "" | RoastLevel
  beanType: "" | BeanType
  processingMethodId: string
  decaf: "" | "true" | "false"
  preferredAcidity: string
  preferredBody: string
  preferredSweetness: string
  preferredAroma: string
}

export const emptyCoffeePreferenceForm: CoffeePreferenceFormState = {
  roastLevel: "",
  beanType: "",
  processingMethodId: "",
  decaf: "",
  preferredAcidity: "",
  preferredBody: "",
  preferredSweetness: "",
  preferredAroma: "",
}

const inputClassName =
  "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors focus:border-neutral-950 disabled:bg-neutral-100"

export function CoffeePreferenceFields({
  value,
  processingMethods,
  disabled = false,
  onChange,
}: {
  value: CoffeePreferenceFormState
  processingMethods: CoffeeReference[]
  disabled?: boolean
  onChange: (nextValue: CoffeePreferenceFormState) => void
}) {
  function handleChange(
    event: ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) {
    const field = event.currentTarget.name as keyof CoffeePreferenceFormState

    onChange({
      ...value,
      [field]: event.currentTarget.value,
    })
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SelectField
        label="로스팅"
        name="roastLevel"
        value={value.roastLevel}
        disabled={disabled}
        onChange={handleChange}
      >
        <option value="">선호 없음</option>
        <option value="LIGHT">라이트</option>
        <option value="MEDIUM">미디엄</option>
        <option value="DARK">다크</option>
      </SelectField>

      <SelectField
        label="원두 구성"
        name="beanType"
        value={value.beanType}
        disabled={disabled}
        onChange={handleChange}
      >
        <option value="">선호 없음</option>
        <option value="SINGLE_ORIGIN">싱글 오리진</option>
        <option value="BLEND">블렌드</option>
      </SelectField>

      <SelectField
        label="가공 방식"
        name="processingMethodId"
        value={value.processingMethodId}
        disabled={disabled}
        onChange={handleChange}
      >
        <option value="">선호 없음</option>
        {processingMethods.map((method) => (
          <option key={method.id} value={String(method.id)}>
            {method.name}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="디카페인"
        name="decaf"
        value={value.decaf}
        disabled={disabled}
        onChange={handleChange}
      >
        <option value="">상관 없음</option>
        <option value="false">일반 원두</option>
        <option value="true">디카페인</option>
      </SelectField>

      <ScoreField
        label="산미"
        name="preferredAcidity"
        value={value.preferredAcidity}
        disabled={disabled}
        onChange={handleChange}
      />
      <ScoreField
        label="바디"
        name="preferredBody"
        value={value.preferredBody}
        disabled={disabled}
        onChange={handleChange}
      />
      <ScoreField
        label="단맛"
        name="preferredSweetness"
        value={value.preferredSweetness}
        disabled={disabled}
        onChange={handleChange}
      />
      <ScoreField
        label="향"
        name="preferredAroma"
        value={value.preferredAroma}
        disabled={disabled}
        onChange={handleChange}
      />
    </div>
  )
}

function SelectField({
  label,
  name,
  value,
  disabled,
  children,
  onChange,
}: {
  label: string
  name: keyof CoffeePreferenceFormState
  value: string
  disabled: boolean
  children: ReactNode
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <select
        name={name}
        value={value}
        disabled={disabled}
        className={inputClassName}
        onChange={onChange}
      >
        {children}
      </select>
    </label>
  )
}

function ScoreField({
  label,
  name,
  value,
  disabled,
  onChange,
}: {
  label: string
  name: keyof CoffeePreferenceFormState
  value: string
  disabled: boolean
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
}) {
  return (
    <SelectField
      label={`${label} 선호도`}
      name={name}
      value={value}
      disabled={disabled}
      onChange={onChange}
    >
      <option value="">선호 없음</option>
      {[1, 2, 3, 4, 5].map((score) => (
        <option key={score} value={String(score)}>
          {score} / 5
        </option>
      ))}
    </SelectField>
  )
}
