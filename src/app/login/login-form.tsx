"use client"

import { useRouter } from "next/navigation"
import { Lock, Mail } from "lucide-react"
import { type ChangeEvent, type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { login } from "@/lib/api/auth"
import { setStoredAuthTokens } from "@/lib/api/auth-token-storage"
import {
  ApiError,
  validationErrorsToFieldMap,
  type ValidationError,
} from "@/lib/api/types"
import { cn } from "@/lib/utils"

type LoginField = "email" | "password"
type LoginFormData = Record<LoginField, string>
type FieldErrors = Partial<Record<LoginField, string>>

const initialFormData: LoginFormData = {
  email: "",
  password: "",
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClassName =
  "h-10 w-full border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"

const fieldErrorClassName = "mt-2 text-xs font-medium text-red-600"

type LoginFormProps = {
  signupSuccess?: boolean
  redirectTo?: string
}

export function LoginForm({
  signupSuccess = false,
  redirectTo = "/",
}: LoginFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>(initialFormData)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const email = formData.email
  const password = formData.password

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as LoginField
    const { value } = event.currentTarget

    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }))
    setFormMessage(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = email.trim()
    const nextErrors = validateForm({
      email: normalizedEmail,
      password,
    })

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setFormMessage("입력 값을 다시 확인해 주세요.")
      return
    }

    setIsSubmitting(true)
    setFormMessage(null)

    try {
      const tokens = await login({
        email: normalizedEmail,
        password,
      })

      setStoredAuthTokens(tokens)
      router.replace(redirectTo)
    } catch (error) {
      const serverErrors = error instanceof ApiError ? error.errors : null

      if (serverErrors?.length) {
        setFieldErrors((current) => ({
          ...current,
          ...toLoginFieldErrors(serverErrors),
        }))
      }

      setFormMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {signupSuccess && (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
          회원가입이 완료되었습니다. 가입한 계정으로 로그인해 주세요.
        </p>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-neutral-800"
          >
            이메일
          </label>

          <div
            data-invalid={Boolean(fieldErrors.email) || undefined}
            className={getInputGroupClassName(Boolean(fieldErrors.email))}
          >
            <Mail className="size-4 text-neutral-400" />
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              placeholder="coffee@example.com"
              autoComplete="email"
              className={inputClassName}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              onChange={handleInputChange}
            />
          </div>

          {fieldErrors.email && (
            <p id="email-error" className={fieldErrorClassName}>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-neutral-800"
          >
            비밀번호
          </label>

          <div
            data-invalid={Boolean(fieldErrors.password) || undefined}
            className={getInputGroupClassName(Boolean(fieldErrors.password))}
          >
            <Lock className="size-4 text-neutral-400" />
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              className={inputClassName}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? "password-error" : undefined
              }
              onChange={handleInputChange}
            />
          </div>

          {fieldErrors.password && (
            <p id="password-error" className={fieldErrorClassName}>
              {fieldErrors.password}
            </p>
          )}
        </div>

        {formMessage && (
          <p
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
            role="alert"
          >
            {formMessage}
          </p>
        )}

        <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
          {isSubmitting ? "로그인 중" : "로그인"}
        </Button>
      </form>
    </>
  )
}

function validateForm(values: LoginFormData) {
  const errors: FieldErrors = {}

  if (!values.email) {
    errors.email = "이메일을 입력해 주세요."
  } else if (!emailPattern.test(values.email)) {
    errors.email = "이메일 형식이 올바르지 않습니다."
  }

  if (!values.password) {
    errors.password = "비밀번호를 입력해 주세요."
  }

  return errors
}

function toLoginFieldErrors(errors: ValidationError[]) {
  const fieldMap = validationErrorsToFieldMap(errors)
  const loginErrors: FieldErrors = {}

  for (const [field, message] of Object.entries(fieldMap)) {
    if (field === "email" || field === "password") {
      loginErrors[field] = message
    }
  }

  return loginErrors
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "요청 처리 중 오류가 발생했습니다."
}

function getInputGroupClassName(hasError: boolean) {
  return cn(
    "flex items-center gap-2 rounded-lg border bg-white px-3",
    hasError ? "border-red-300" : "border-neutral-300"
  )
}
