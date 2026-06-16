"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AtSign,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react"
import { type ChangeEvent, type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { checkEmailAvailable, signup } from "@/lib/api/auth"
import {
  ApiError,
  validationErrorsToFieldMap,
  type ValidationError,
} from "@/lib/api/types"
import { cn } from "@/lib/utils"

type SignupField =
  | "email"
  | "password"
  | "passwordConfirm"
  | "name"
  | "nickname"
  | "termsAccepted"

type SignupFormData = Record<SignupField, string | boolean>
type FieldErrors = Partial<Record<SignupField, string>>
type EmailCheckStatus = "idle" | "checking" | "available" | "unavailable"

const initialFormData: SignupFormData = {
  email: "",
  password: "",
  passwordConfirm: "",
  name: "",
  nickname: "",
  termsAccepted: false,
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClassName =
  "h-10 w-full border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"

const fieldErrorClassName = "mt-2 text-xs font-medium text-red-600"

export function SignupForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<SignupFormData>(initialFormData)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [emailCheckStatus, setEmailCheckStatus] =
    useState<EmailCheckStatus>("idle")
  const [checkedEmail, setCheckedEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const email = String(formData.email)
  const password = String(formData.password)
  const passwordConfirm = String(formData.passwordConfirm)
  const name = String(formData.name)
  const nickname = String(formData.nickname)
  const termsAccepted = Boolean(formData.termsAccepted)
  const isBusy = isSubmitting || emailCheckStatus === "checking"

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name: fieldName, type, checked, value } = event.currentTarget
    const field = fieldName as SignupField

    setFormData((current) => ({
      ...current,
      [field]: type === "checkbox" ? checked : value,
    }))
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }))
    setFormMessage(null)

    if (field === "email") {
      setEmailCheckStatus("idle")
      setCheckedEmail("")
    }
  }

  async function handleEmailCheck() {
    const normalizedEmail = email.trim()
    const emailError = validateEmail(normalizedEmail)

    if (emailError) {
      setFieldErrors((current) => ({ ...current, email: emailError }))
      setEmailCheckStatus("idle")
      return
    }

    setEmailCheckStatus("checking")
    setFieldErrors((current) => ({ ...current, email: undefined }))
    setFormMessage(null)

    try {
      const result = await checkEmailAvailable(normalizedEmail)

      if (result.available) {
        setCheckedEmail(normalizedEmail)
        setEmailCheckStatus("available")
        return
      }

      setCheckedEmail("")
      setEmailCheckStatus("unavailable")
      setFieldErrors((current) => ({
        ...current,
        email: "이미 사용 중인 이메일입니다.",
      }))
    } catch (error) {
      setEmailCheckStatus("idle")
      setFormMessage(getErrorMessage(error))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = email.trim()
    const nextErrors = validateForm({
      email: normalizedEmail,
      password,
      passwordConfirm,
      name: name.trim(),
      nickname: nickname.trim(),
      termsAccepted,
    })

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setFormMessage("입력 값을 다시 확인해 주세요.")
      return
    }

    if (
      emailCheckStatus === "unavailable" ||
      (checkedEmail && checkedEmail !== normalizedEmail)
    ) {
      setFieldErrors((current) => ({
        ...current,
        email: "이메일 중복 확인을 다시 진행해 주세요.",
      }))
      return
    }

    setIsSubmitting(true)
    setFormMessage(null)

    try {
      await signup({
        email: normalizedEmail,
        password,
        name: name.trim(),
        nickname: nickname.trim(),
      })

      router.push("/login?signup=success")
    } catch (error) {
      const serverErrors = error instanceof ApiError ? error.errors : null

      if (serverErrors?.length) {
        setFieldErrors((current) => ({
          ...current,
          ...toSignupFieldErrors(serverErrors),
        }))
      }

      setFormMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-neutral-800"
        >
          이메일
        </label>

        <div className="flex gap-2">
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

          <Button
            type="button"
            variant="outline"
            disabled={emailCheckStatus === "checking" || isSubmitting}
            onClick={handleEmailCheck}
          >
            {emailCheckStatus === "checking" ? "확인 중" : "중복 확인"}
          </Button>
        </div>

        {emailCheckStatus === "available" && (
          <p className="mt-2 flex items-center gap-1 text-xs font-medium text-green-700">
            <CheckCircle2 className="size-3.5" />
            사용 가능한 이메일입니다.
          </p>
        )}

        {fieldErrors.email && (
          <p id="email-error" className={fieldErrorClassName}>
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-neutral-800"
        >
          이름
        </label>

        <div
          data-invalid={Boolean(fieldErrors.name) || undefined}
          className={getInputGroupClassName(Boolean(fieldErrors.name))}
        >
          <User className="size-4 text-neutral-400" />
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            maxLength={50}
            placeholder="홍길동"
            autoComplete="name"
            className={inputClassName}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
            onChange={handleInputChange}
          />
        </div>

        {fieldErrors.name && (
          <p id="name-error" className={fieldErrorClassName}>
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="nickname"
          className="mb-2 block text-sm font-medium text-neutral-800"
        >
          닉네임
        </label>

        <div
          data-invalid={Boolean(fieldErrors.nickname) || undefined}
          className={getInputGroupClassName(Boolean(fieldErrors.nickname))}
        >
          <AtSign className="size-4 text-neutral-400" />
          <input
            id="nickname"
            name="nickname"
            type="text"
            required
            value={nickname}
            maxLength={50}
            placeholder="coffeeUser"
            autoComplete="nickname"
            className={inputClassName}
            aria-invalid={Boolean(fieldErrors.nickname)}
            aria-describedby={
              fieldErrors.nickname ? "nickname-error" : undefined
            }
            onChange={handleInputChange}
          />
        </div>

        {fieldErrors.nickname && (
          <p id="nickname-error" className={fieldErrorClassName}>
            {fieldErrors.nickname}
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
            minLength={8}
            maxLength={100}
            placeholder="8자 이상 입력하세요"
            autoComplete="new-password"
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

      <div>
        <label
          htmlFor="passwordConfirm"
          className="mb-2 block text-sm font-medium text-neutral-800"
        >
          비밀번호 확인
        </label>

        <div
          data-invalid={Boolean(fieldErrors.passwordConfirm) || undefined}
          className={getInputGroupClassName(
            Boolean(fieldErrors.passwordConfirm)
          )}
        >
          <ShieldCheck className="size-4 text-neutral-400" />
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            required
            value={passwordConfirm}
            minLength={8}
            maxLength={100}
            placeholder="비밀번호를 한 번 더 입력하세요"
            autoComplete="new-password"
            className={inputClassName}
            aria-invalid={Boolean(fieldErrors.passwordConfirm)}
            aria-describedby={
              fieldErrors.passwordConfirm ? "password-confirm-error" : undefined
            }
            onChange={handleInputChange}
          />
        </div>

        {fieldErrors.passwordConfirm && (
          <p id="password-confirm-error" className={fieldErrorClassName}>
            {fieldErrors.passwordConfirm}
          </p>
        )}
      </div>

      <div
        data-invalid={Boolean(fieldErrors.termsAccepted) || undefined}
        className={cn(
          "rounded-lg border bg-neutral-50 p-4 text-sm",
          fieldErrors.termsAccepted ? "border-red-300" : "border-neutral-200"
        )}
      >
        <label className="flex gap-3">
          <input
            name="termsAccepted"
            type="checkbox"
            required
            checked={termsAccepted}
            className="mt-0.5 size-4"
            aria-invalid={Boolean(fieldErrors.termsAccepted)}
            aria-describedby={
              fieldErrors.termsAccepted ? "terms-error" : undefined
            }
            onChange={handleInputChange}
          />
          <span>
            <span className="font-medium text-neutral-950">
              필수 약관에 동의합니다.
            </span>
            <span className="mt-1 block leading-6 text-neutral-600">
              CoffeeProd의{" "}
              <Link href="/terms" className="font-medium text-neutral-950">
                이용약관
              </Link>
              과{" "}
              <Link href="/privacy" className="font-medium text-neutral-950">
                개인정보처리방침
              </Link>
              을 확인했습니다.
            </span>
          </span>
        </label>

        {fieldErrors.termsAccepted && (
          <p id="terms-error" className={fieldErrorClassName}>
            {fieldErrors.termsAccepted}
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

      <Button type="submit" className="mt-2 w-full" disabled={isBusy}>
        {isSubmitting ? "가입 중" : "회원가입"}
      </Button>
    </form>
  )
}

function validateForm(values: {
  email: string
  password: string
  passwordConfirm: string
  name: string
  nickname: string
  termsAccepted: boolean
}) {
  const errors: FieldErrors = {}
  const emailError = validateEmail(values.email)

  if (emailError) {
    errors.email = emailError
  }

  if (!values.name) {
    errors.name = "이름을 입력해 주세요."
  } else if (values.name.length > 50) {
    errors.name = "이름은 50자 이하로 입력해 주세요."
  }

  if (!values.nickname) {
    errors.nickname = "닉네임을 입력해 주세요."
  } else if (values.nickname.length > 50) {
    errors.nickname = "닉네임은 50자 이하로 입력해 주세요."
  }

  if (!values.password) {
    errors.password = "비밀번호를 입력해 주세요."
  } else if (values.password.length < 8 || values.password.length > 100) {
    errors.password = "비밀번호는 8자 이상 100자 이하로 입력해 주세요."
  }

  if (!values.passwordConfirm) {
    errors.passwordConfirm = "비밀번호 확인을 입력해 주세요."
  } else if (values.password !== values.passwordConfirm) {
    errors.passwordConfirm = "비밀번호가 일치하지 않습니다."
  }

  if (!values.termsAccepted) {
    errors.termsAccepted = "필수 약관에 동의해 주세요."
  }

  return errors
}

function validateEmail(email: string) {
  if (!email) {
    return "이메일을 입력해 주세요."
  }

  if (!emailPattern.test(email)) {
    return "이메일 형식이 올바르지 않습니다."
  }

  return null
}

function toSignupFieldErrors(errors: ValidationError[]) {
  const fieldMap = validationErrorsToFieldMap(errors)
  const signupErrors: FieldErrors = {}

  for (const [field, message] of Object.entries(fieldMap)) {
    if (isSignupField(field)) {
      signupErrors[field] = message
    }
  }

  return signupErrors
}

function isSignupField(field: string): field is SignupField {
  return (
    field === "email" ||
    field === "password" ||
    field === "passwordConfirm" ||
    field === "name" ||
    field === "nickname" ||
    field === "termsAccepted"
  )
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "요청 처리 중 오류가 발생했습니다."
}

function getInputGroupClassName(hasError: boolean) {
  return cn(
    "flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-white px-3",
    hasError ? "border-red-300" : "border-neutral-300"
  )
}
