"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react"
import {
  type ChangeEvent,
  type ComponentType,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react"

import { SiteFooter } from "@/components/site-footer"
import { SocialAccountSettings } from "@/components/social-account-settings"
import { SiteHeader } from "@/components/site-header"
import { PasswordVisibilityButton } from "@/components/password-visibility-button"
import { LoadError } from "@/components/load-error"
import { Button } from "@/components/ui/button"
import { useModalDialog } from "@/components/use-modal-dialog"
import { getMe, type Member, type MemberGrade, type MemberStatus } from "@/lib/api/auth"
import {
  AUTH_TOKENS_CHANGED_EVENT,
  clearStoredAuthTokens,
  getStoredAuthTokens,
} from "@/lib/api/auth-token-storage"
import {
  changeMemberPassword,
  updateMemberProfile,
  withdrawMember,
} from "@/lib/api/member"
import { useFormErrorFocus } from "@/lib/form-feedback"
import { ApiError, validationErrorsToFieldMap } from "@/lib/api/types"

import { CartNavButton } from "../cart/cart-nav-button"

type MyPageStatus = "checking" | "guest" | "ready" | "error"
type ProfileField = "nickname"
type PasswordField = "currentPassword" | "newPassword" | "newPasswordConfirm"
type WithdrawField = "currentPassword"
type WithdrawDialog = "confirm" | "success" | null

type ProfileErrors = Partial<Record<ProfileField, string>>
type PasswordErrors = Partial<Record<PasswordField, string>>
type WithdrawErrors = Partial<Record<WithdrawField, string>>

const fieldErrorClassName = "mt-1.5 text-xs font-medium text-red-600"
const inputClassName =
  "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950 disabled:bg-neutral-100 disabled:text-neutral-400"

export function MyPageView() {
  const focusFormError = useFormErrorFocus()
  const router = useRouter()
  const [status, setStatus] = useState<MyPageStatus>("checking")
  const [loadError, setLoadError] = useState<unknown>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [member, setMember] = useState<Member | null>(null)
  const [nickname, setNickname] = useState("")
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({})
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  })
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({})
  const [withdrawPassword, setWithdrawPassword] = useState("")
  const [withdrawErrors, setWithdrawErrors] = useState<WithdrawErrors>({})
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileMessageTone, setProfileMessageTone] = useState<"success" | "error">("success")
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<"success" | "error">("success")
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawDialog, setWithdrawDialog] = useState<WithdrawDialog>(null)
  const withdrawPendingRef = useRef(false)
  const withdrawFormRef = useRef<HTMLFormElement>(null)
  const withdrawSubmitRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let isActive = true
    function checkTokens() {
      if (!getStoredAuthTokens()) {
        isActive = false
        setStatus("guest")
      }
    }
    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, checkTokens)

    async function load() {
      if (!getStoredAuthTokens()) {
        if (isActive) setStatus("guest")
        return
      }
      setStatus("checking")
      setLoadError(null)
      try {
        const data = await getMe()
        if (!isActive) return
        setMember(data)
        setNickname(data.nickname)
        setStatus("ready")
      } catch (error) {
        if (!isActive) return
        if (error instanceof ApiError && error.kind === "UNAUTHORIZED") {
          setStatus("guest")
        } else {
          setLoadError(error)
          setStatus("error")
        }
      }
    }
    void load()
    return () => {
      isActive = false
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, checkTokens)
    }
  }, [retryCount])

  function handleNicknameChange(event: ChangeEvent<HTMLInputElement>) {
    setNickname(event.currentTarget.value)
    setProfileErrors({})
    setProfileMessage(null)
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as PasswordField
    const { value } = event.currentTarget

    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }))
    setPasswordErrors((current) => ({
      ...current,
      [field]: undefined,
    }))
    setMessage(null)
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget

    const normalizedNickname = nickname.trim()
    const nextErrors = validateProfile(normalizedNickname)

    if (Object.keys(nextErrors).length > 0) {
      setProfileErrors(nextErrors)
      setProfileMessageTone("error")
      setProfileMessage("닉네임을 다시 확인해 주세요.")
      focusFormError(form, "profile-message")
      return
    }

    setProfileErrors({})
    setIsProfileSubmitting(true)
    setProfileMessage(null)

    try {
      const updatedMember = await updateMemberProfile({
        nickname: normalizedNickname,
      })
      setMember(updatedMember)
      setNickname(updatedMember.nickname)
      setProfileMessageTone("success")
      setProfileMessage("내 정보를 수정했습니다.")
    } catch (error) {
      if (error instanceof ApiError && error.errors?.length) {
        setProfileErrors(
          validationErrorsToFieldMap(error.errors) as ProfileErrors
        )
      }

      setProfileMessageTone("error")
      setProfileMessage(getMemberErrorMessage(error))
      focusFormError(form, "profile-message")
    } finally {
      setIsProfileSubmitting(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget

    const nextErrors = validatePassword(passwordForm)

    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors)
      setMessageTone("error")
      setMessage("비밀번호 입력 값을 다시 확인해 주세요.")
      focusFormError(form, "member-form-message")
      return
    }

    setPasswordErrors({})
    setIsPasswordSubmitting(true)
    setMessage(null)

    try {
      await changeMemberPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      clearStoredAuthTokens()
      router.replace("/password-changed")
    } catch (error) {
      if (error instanceof ApiError && error.errors?.length) {
        setPasswordErrors(
          validationErrorsToFieldMap(error.errors) as PasswordErrors
        )
      }

      setMessageTone("error")
      setMessage(getMemberErrorMessage(error))
      focusFormError(form, "member-form-message")
    } finally {
      setIsPasswordSubmitting(false)
    }
  }

  async function handleWithdrawSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget

    if (!withdrawPassword) {
      setWithdrawErrors({
        currentPassword: "현재 비밀번호를 입력해 주세요.",
      })
      setMessageTone("error")
      setMessage("회원 탈퇴를 위해 현재 비밀번호가 필요합니다.")
      focusFormError(form, "member-form-message")
      return
    }

    setWithdrawErrors({})
    setMessage(null)
    setWithdrawDialog("confirm")
  }

  async function executeWithdraw() {
    if (withdrawPendingRef.current) return
    withdrawPendingRef.current = true
    setIsWithdrawing(true)
    setMessage(null)

    try {
      await withdrawMember({
        currentPassword: withdrawPassword,
      })
      clearStoredAuthTokens()
      setWithdrawDialog("success")

    } catch (error) {
      if (error instanceof ApiError && error.errors?.length) {
        setWithdrawErrors(
          validationErrorsToFieldMap(error.errors) as WithdrawErrors
        )
      }

      setMessageTone("error")
      setMessage(getMemberErrorMessage(error))
      setWithdrawDialog(null)
      focusFormError(withdrawFormRef.current, "member-form-message")
    } finally {
      withdrawPendingRef.current = false
      setIsWithdrawing(false)
    }
  }

  return (
    <main className="account-page flex min-h-screen flex-col bg-neutral-50 text-neutral-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[1320px] flex-1 px-6 py-12">

        <section className="mb-8">
          <h1 className="text-4xl font-bold">나의 CoffeeProd</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            내 정보와 계정 설정, 배송지와 주문 관련 메뉴를 관리합니다.
          </p>
        </section>

        {status === "checking" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
            회원 정보를 확인하고 있습니다.
          </section>
        )}

        {status === "error" && (
          <LoadError title="회원 정보를 불러오지 못했습니다." error={loadError} onRetry={() => setRetryCount((current) => current + 1)} loginHref="/login?redirect=/me" />
        )}

        {status === "guest" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
              <UserRound className="size-6 text-neutral-500" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">로그인이 필요합니다.</h2>
            <p className="mt-3 text-sm text-neutral-600">
              마이페이지는 로그인 후 이용할 수 있습니다.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/login?redirect=/me">로그인하기</Link>
            </Button>
          </section>
        )}

        {status === "ready" && member && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex min-w-0 flex-col gap-6">
              {message && (
                <p id="member-form-message" tabIndex={-1}
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

              <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                    <UserRound className="size-6 text-neutral-500" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-bold">
                      {member.nickname}님
                    </h2>
                    <p className="mt-1 break-words text-sm text-neutral-500">
                      {member.email}
                    </p>
                  </div>
                </div>

                <dl className="mt-6 grid gap-4 md:grid-cols-3">
                  <MemberInfo label="이름" value={member.name} />
                  <MemberInfo label="등급" value={getGradeLabel(member.grade)} />
                  <MemberInfo
                    label="마일리지"
                    value={`${member.mileage.toLocaleString()}P`}
                  />
                  <MemberInfo
                    label="상태"
                    value={getStatusLabel(member.status)}
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Pencil className="size-5 text-neutral-500" />
                  <h2 className="text-lg font-bold">내 정보 수정</h2>
                </div>
                {profileMessage && (
                  <p id="profile-message" tabIndex={-1}
                    className={
                      profileMessageTone === "success"
                        ? "mt-4 animate-success-pop rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700"
                        : "mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                    }
                    role={profileMessageTone === "error" ? "alert" : "status"}
                  >
                    {profileMessage}
                  </p>
                )}
                <form
                  className="mt-5 flex flex-col gap-4 md:max-w-md"
                  noValidate
                  aria-label="내 정보 수정"
                  onSubmit={handleProfileSubmit}
                >
                  <div>
                    <label
                      htmlFor="nickname"
                      className="mb-2 block text-sm font-semibold"
                    >
                      닉네임
                    </label>
                    <input
                      id="nickname"
                      name="nickname"
                      required
                      autoComplete="nickname"
                      value={nickname}
                      maxLength={50}
                      disabled={isProfileSubmitting}
                      className={inputClassName}
                      aria-invalid={Boolean(profileErrors.nickname)}
                      aria-describedby={
                        profileErrors.nickname ? "nickname-error" : undefined
                      }
                      onChange={handleNicknameChange}
                    />
                    {profileErrors.nickname && (
                      <p id="nickname-error" className={fieldErrorClassName}>
                        {profileErrors.nickname}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isProfileSubmitting}
                    className="w-fit"
                  >
                    <Pencil data-icon="inline-start" />
                    {isProfileSubmitting ? "저장 중" : "저장하기"}
                  </Button>
                </form>
              </section>

              <SocialAccountSettings hasLocalPassword={member.hasLocalPassword !== false} />
              {member.hasLocalPassword !== false && <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <KeyRound className="size-5 text-neutral-500" />
                  <h2 className="text-lg font-bold">비밀번호 변경</h2>
                </div>
                <form
                  className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3"
                  noValidate
                  aria-label="비밀번호 변경"
                  onSubmit={handlePasswordSubmit}
                >
                  <PasswordInput
                    label="현재 비밀번호"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    error={passwordErrors.currentPassword}
                    disabled={isPasswordSubmitting}
                    onChange={handlePasswordChange}
                  />
                  <PasswordInput
                    label="새 비밀번호"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    error={passwordErrors.newPassword}
                    disabled={isPasswordSubmitting}
                    onChange={handlePasswordChange}
                  />
                  <PasswordInput
                    label="새 비밀번호 확인"
                    name="newPasswordConfirm"
                    value={passwordForm.newPasswordConfirm}
                    error={passwordErrors.newPasswordConfirm}
                    disabled={isPasswordSubmitting}
                    onChange={handlePasswordChange}
                  />
                  <div className="md:col-span-3">
                    <Button type="submit" disabled={isPasswordSubmitting}>
                      <KeyRound data-icon="inline-start" />
                      {isPasswordSubmitting ? "변경 중" : "비밀번호 변경"}
                    </Button>
                  </div>
                </form>
              </section>}

              {member.hasLocalPassword !== false && <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Trash2 className="size-5 text-red-600" />
                  <h2 className="text-lg font-bold">회원 탈퇴</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  탈퇴하면 로그인이 종료되며, 같은 계정으로 로그인할 수 없습니다.
                </p>
                <form
                  className="mt-5 flex flex-col gap-4 md:max-w-md"
                  noValidate
                  aria-label="회원 탈퇴"
                  ref={withdrawFormRef}
                  onSubmit={handleWithdrawSubmit}
                >
                  <PasswordInput
                    inputId="me-withdraw-currentPassword"
                    label="현재 비밀번호"
                    name="currentPassword"
                    value={withdrawPassword}
                    error={withdrawErrors.currentPassword}
                    disabled={isWithdrawing}
                    onChange={(event) => {
                      setWithdrawPassword(event.currentTarget.value)
                      setWithdrawErrors({})
                      setMessage(null)
                    }}
                  />
                  <Button
                    ref={withdrawSubmitRef}
                    type="submit"
                    variant="destructive"
                    disabled={isWithdrawing}
                    className="w-fit"
                  >
                    <LogOut data-icon="inline-start" />
                    {isWithdrawing ? "탈퇴 처리 중" : "회원 탈퇴"}
                  </Button>
                </form>
              </section>}
            </div>

            <aside className="h-fit min-w-0 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">바로가기</h2>
              <div className="mt-5 flex flex-col gap-2">
                <QuickLink
                  href="/me/coffee-preference"
                  label="커피 취향 관리"
                  icon={Sparkles}
                />
                <QuickLink href="/me/addresses" label="배송지 관리" icon={MapPin} />
                <CartNavButton className="justify-start" />
                <QuickLink href="/orders" label="주문 내역" icon={Package} />
              </div>
            </aside>
          </section>
        )}
      </div>

      <SiteFooter />

      {withdrawDialog === "confirm" && (
        <WithdrawConfirmDialog
          isSubmitting={isWithdrawing}
          onCancel={() => setWithdrawDialog(null)}
          onConfirm={executeWithdraw}
        />
      )}

      {withdrawDialog === "success" && <WithdrawSuccessDialog onDismiss={() => router.replace("/")} />}
    </main>
  )
}

function MemberInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <dt className="text-sm font-medium text-neutral-500">{label}</dt>
      <dd className="mt-2 break-words font-semibold text-neutral-950">
        {value}
      </dd>
    </div>
  )
}

function PasswordInput({
  inputId: explicitInputId,
  label,
  name,
  value,
  error,
  disabled,
  onChange,
}: {
  inputId?: string
  label: string
  name: PasswordField | WithdrawField
  value: string
  error?: string
  disabled: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const [visible, setVisible] = useState(false)
  const inputId = explicitInputId ?? `me-${name}`
  const errorId = `${inputId}-error`

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <div
        data-invalid={Boolean(error) || undefined}
        className={`flex items-center rounded-lg border bg-white focus-within:border-neutral-950 ${error ? "border-red-300" : "border-neutral-300"}`}
      >
        <input
          id={inputId}
          name={name}
          required
          autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
          type={visible ? "text" : "password"}
          value={value}
          disabled={disabled}
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none disabled:text-neutral-400"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={onChange}
        />
        <PasswordVisibilityButton
          inputId={inputId}
          label={label}
          visible={visible}
          disabled={disabled}
          onToggle={() => setVisible((current) => !current)}
        />
      </div>
      {error && (
        <p id={errorId} className={fieldErrorClassName}>
          {error}
        </p>
      )}
    </div>
  )
}

function QuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Button variant="outline" className="justify-start" asChild>
      <Link href={href}>
        <Icon data-icon="inline-start" />
        {label}
      </Link>
    </Button>
  )
}

function WithdrawConfirmDialog({
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useModalDialog(dialog)

  return (
    <dialog
      ref={dialog}
      className="app-modal-dialog"
      aria-labelledby="withdraw-confirm-title"
      aria-describedby="withdraw-confirm-description"
      onCancel={(event) => {
        event.preventDefault()
        if (!isSubmitting) onCancel()
      }}
      onClose={() => {
        if (!dialog.current?.open && !isSubmitting) onCancel()
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="size-5 text-red-600" />
          </div>
          <div>
            <h2 id="withdraw-confirm-title" className="text-lg font-bold">
              정말 탈퇴하시겠습니까?
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              탈퇴 후 계정 이용이 제한됩니다.
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={isSubmitting}
          onClick={onCancel}
          aria-label="닫기"
        >
          <X />
        </Button>
      </div>

      <p id="withdraw-confirm-description" className="mt-5 rounded-lg bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
        탈퇴하면 로그인이 종료되며, 같은 계정으로 로그인할 수 없습니다.
      </p>
      {isSubmitting && <p role="status" className="mt-3 text-sm">탈퇴 처리 중입니다. 결과를 확인할 때까지 기다려 주세요.</p>}

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button
          data-modal-autofocus
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          취소
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isSubmitting}
          onClick={onConfirm}
        >
          <LogOut data-icon="inline-start" />
          {isSubmitting ? "탈퇴 처리 중" : "탈퇴하기"}
        </Button>
      </div>
    </dialog>
  )
}

function WithdrawSuccessDialog({ onDismiss }: { onDismiss: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useModalDialog(dialog)
  return (
    <dialog
      ref={dialog}
      className="app-modal-dialog text-center"
      aria-labelledby="withdraw-success-title"
      aria-describedby="withdraw-success-description"
      onCancel={(event) => { event.preventDefault(); onDismiss() }}
      onClose={() => { if (!dialog.current?.open) onDismiss() }}
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-50">
        <CheckCircle2 className="size-6 text-green-600" />
      </div>
      <h2 id="withdraw-success-title" className="mt-5 text-xl font-bold">
        회원 탈퇴가 완료되었습니다.
      </h2>
      <p id="withdraw-success-description" className="mt-3 text-sm leading-6 text-neutral-600">
        그동안 CoffeeProd를 이용해 주셔서 감사합니다.
      </p>
      <Button data-modal-autofocus type="button" className="mt-6" onClick={onDismiss}>메인으로 이동</Button>
    </dialog>
  )
}

function validateProfile(nickname: string) {
  const errors: ProfileErrors = {}

  if (!nickname) {
    errors.nickname = "닉네임을 입력해 주세요."
  } else if (nickname.length > 50) {
    errors.nickname = "닉네임은 50자 이하로 입력해 주세요."
  }

  return errors
}

function validatePassword(values: {
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}) {
  const errors: PasswordErrors = {}

  if (!values.currentPassword) {
    errors.currentPassword = "현재 비밀번호를 입력해 주세요."
  }

  if (!values.newPassword) {
    errors.newPassword = "새 비밀번호를 입력해 주세요."
  } else if (values.newPassword.length < 8 || values.newPassword.length > 100) {
    errors.newPassword = "비밀번호는 8자 이상 100자 이하로 입력해 주세요."
  }

  if (!values.newPasswordConfirm) {
    errors.newPasswordConfirm = "새 비밀번호를 한 번 더 입력해 주세요."
  } else if (values.newPassword !== values.newPasswordConfirm) {
    errors.newPasswordConfirm = "새 비밀번호가 일치하지 않습니다."
  }

  return errors
}

function getMemberErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "요청을 처리하지 못했습니다."
}

function getGradeLabel(grade: MemberGrade) {
  if (grade === "BRONZE") {
    return "브론즈"
  }

  if (grade === "SILVER") {
    return "실버"
  }

  return "골드"
}

function getStatusLabel(status: MemberStatus) {
  if (status === "ACTIVE") {
    return "정상"
  }

  if (status === "SUSPENDED") {
    return "정지"
  }

  return "탈퇴"
}
