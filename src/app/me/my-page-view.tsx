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
  useState,
} from "react"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { getMe, type Member, type MemberGrade, type MemberStatus } from "@/lib/api/auth"
import {
  clearStoredAuthTokens,
  getStoredAuthTokens,
} from "@/lib/api/auth-token-storage"
import {
  changeMemberPassword,
  updateMemberProfile,
  withdrawMember,
} from "@/lib/api/member"
import { ApiError, validationErrorsToFieldMap } from "@/lib/api/types"

import { CartNavButton } from "../cart/cart-nav-button"

type MyPageStatus = "checking" | "guest" | "ready"
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
  const router = useRouter()
  const [status, setStatus] = useState<MyPageStatus>("checking")
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

  useEffect(() => {
    let isActive = true

    async function loadMember() {
      if (!getStoredAuthTokens()) {
        if (isActive) {
          setStatus("guest")
        }
        return
      }

      try {
        const currentMember = await getMe()

        if (isActive) {
          setMember(currentMember)
          setNickname(currentMember.nickname)
          setStatus("ready")
        }
      } catch {
        clearStoredAuthTokens()

        if (isActive) {
          setStatus("guest")
        }
      }
    }

    void loadMember()

    return () => {
      isActive = false
    }
  }, [])

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

    const normalizedNickname = nickname.trim()
    const nextErrors = validateProfile(normalizedNickname)

    if (Object.keys(nextErrors).length > 0) {
      setProfileErrors(nextErrors)
      setProfileMessageTone("error")
      setProfileMessage("닉네임을 다시 확인해 주세요.")
      return
    }

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
    } finally {
      setIsProfileSubmitting(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validatePassword(passwordForm)

    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors)
      setMessageTone("error")
      setMessage("비밀번호 입력 값을 다시 확인해 주세요.")
      return
    }

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
    } finally {
      setIsPasswordSubmitting(false)
    }
  }

  async function handleWithdrawSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!withdrawPassword) {
      setWithdrawErrors({
        currentPassword: "현재 비밀번호를 입력해 주세요.",
      })
      setMessageTone("error")
      setMessage("회원 탈퇴를 위해 현재 비밀번호가 필요합니다.")
      return
    }

    setMessage(null)
    setWithdrawDialog("confirm")
  }

  async function executeWithdraw() {
    setIsWithdrawing(true)
    setMessage(null)

    try {
      await withdrawMember({
        currentPassword: withdrawPassword,
      })
      clearStoredAuthTokens()
      setWithdrawDialog("success")

      window.setTimeout(() => {
        router.replace("/")
      }, 1500)
    } catch (error) {
      if (error instanceof ApiError && error.errors?.length) {
        setWithdrawErrors(
          validationErrorsToFieldMap(error.errors) as WithdrawErrors
        )
      }

      setMessageTone("error")
      setMessage(getMemberErrorMessage(error))
      setWithdrawDialog(null)
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <main className="account-page flex min-h-screen flex-col bg-neutral-50 text-neutral-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[1320px] flex-1 px-6 py-12">

        <section className="mb-8">
          <p className="editorial-kicker">My account</p>
          <h1 className="mt-3 text-4xl font-bold">나의 CoffeeProd</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            내 정보와 계정 설정, 배송지와 주문 관련 메뉴를 관리합니다.
          </p>
        </section>

        {status === "checking" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
            회원 정보를 확인하고 있습니다.
          </section>
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
            <div className="flex flex-col gap-6">
              {message && (
                <p
                  className={
                    messageTone === "success"
                      ? "rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700"
                      : "rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                  }
                  role="status"
                >
                  {message}
                </p>
              )}

              <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100">
                    <UserRound className="size-6 text-neutral-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{member.nickname}님</h2>
                    <p className="mt-1 text-sm text-neutral-500">
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
                  <MemberInfo label="회원 번호" value={String(member.id)} />
                </dl>
              </section>

              <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Pencil className="size-5 text-neutral-500" />
                  <h2 className="text-lg font-bold">내 정보 수정</h2>
                </div>
                {profileMessage && (
                  <p
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

              <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <KeyRound className="size-5 text-neutral-500" />
                  <h2 className="text-lg font-bold">비밀번호 변경</h2>
                </div>
                <form
                  className="mt-5 grid gap-4 md:grid-cols-3"
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
              </section>

              <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Trash2 className="size-5 text-red-600" />
                  <h2 className="text-lg font-bold">회원 탈퇴</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  탈퇴 후 현재 토큰은 제거되며, 같은 계정으로 로그인할 수 없습니다.
                </p>
                <form
                  className="mt-5 flex flex-col gap-4 md:max-w-md"
                  onSubmit={handleWithdrawSubmit}
                >
                  <PasswordInput
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
                    type="submit"
                    variant="destructive"
                    disabled={isWithdrawing}
                    className="w-fit"
                  >
                    <LogOut data-icon="inline-start" />
                    {isWithdrawing ? "탈퇴 처리 중" : "회원 탈퇴"}
                  </Button>
                </form>
              </section>
            </div>

            <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
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

      {withdrawDialog === "success" && <WithdrawSuccessDialog />}
    </main>
  )
}

function MemberInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <dt className="text-sm font-medium text-neutral-500">{label}</dt>
      <dd className="mt-2 font-semibold text-neutral-950">{value}</dd>
    </div>
  )
}

function PasswordInput({
  label,
  name,
  value,
  error,
  disabled,
  onChange,
}: {
  label: string
  name: PasswordField | WithdrawField
  value: string
  error?: string
  disabled: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const inputId = `me-${name}`
  const errorId = `${inputId}-error`

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type="password"
        value={value}
        disabled={disabled}
        className={inputClassName}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={onChange}
      />
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6">
      <section
        className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-confirm-title"
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

        <p className="mt-5 rounded-lg bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
          주문 내역과 계정 상태가 탈퇴 처리됩니다. 계속 진행하려면 아래
          버튼을 눌러 주세요.
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button
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
      </section>
    </div>
  )
}

function WithdrawSuccessDialog() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6">
      <section
        className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 text-center shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-success-title"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="size-6 text-green-600" />
        </div>
        <h2 id="withdraw-success-title" className="mt-5 text-xl font-bold">
          회원 탈퇴가 완료되었습니다.
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          그동안 CoffeeProd를 이용해 주셔서 감사합니다.
        </p>
        <p className="mt-4 text-xs font-medium text-neutral-500">
          잠시 후 메인 화면으로 이동합니다.
        </p>
      </section>
    </div>
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
