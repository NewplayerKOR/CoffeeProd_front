"use client"
import { confirmAction } from "@/components/confirm-action"

import Link from "next/link"
import Script from "next/script"
import {
  Check,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { LoadError } from "@/components/load-error"
import { Button } from "@/components/ui/button"
import { sameFormValues, useUnsavedChanges } from "@/components/unsaved-changes-provider"
import {
  createAddress,
  deleteAddress,
  getAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
  type Address,
  type AddressRequest,
} from "@/lib/api/address"
import { AUTH_TOKENS_CHANGED_EVENT, getStoredAuthTokens } from "@/lib/api/auth-token-storage"
import { ApiError, validationErrorsToFieldMap } from "@/lib/api/types"
import { useFormErrorFocus } from "@/lib/form-feedback"
import { cn } from "@/lib/utils"

type AddressStatus = "checking" | "guest" | "ready" | "error"
type AddressField = keyof AddressRequest
type AddressFormData = AddressRequest
type FieldErrors = Partial<Record<AddressField, string>>

type DaumPostcodeData = {
  zonecode: string
  userSelectedType: "R" | "J"
  roadAddress: string
  jibunAddress: string
  bname: string
  buildingName: string
  apartment: "Y" | "N"
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void
      }) => {
        open: () => void
      }
    }
  }
}

const emptyFormData: AddressFormData = {
  recipient: "",
  phone: "",
  zipcode: "",
  addressLine1: "",
  addressLine2: "",
}

const addressAutoComplete: Record<AddressField, string> = {
  recipient: "shipping name",
  phone: "shipping tel",
  zipcode: "shipping postal-code",
  addressLine1: "shipping address-line1",
  addressLine2: "shipping address-line2",
}

const fieldErrorClassName = "mt-1.5 text-xs font-medium text-red-600"
const inputClassName =
  "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950 disabled:bg-neutral-100 disabled:text-neutral-400"

export function AddressManager() {
  const focusFormError = useFormErrorFocus()
  const detailAddressRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<AddressStatus>("checking")
  const [loadError, setLoadError] = useState<unknown>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [formData, setFormData] = useState<AddressFormData>(emptyFormData)
  const [savedFormData, setSavedFormData] = useState<AddressFormData>(emptyFormData)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null)
  const [pendingAddressId, setPendingAddressId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<"success" | "error">("success")
  const [isPostcodeReady, setIsPostcodeReady] = useState(false)
  const editorVersion = useRef(0)
  const busy = isSubmitting || pendingAddressId !== null
  const guard = useUnsavedChanges("address", "배송지 정보", !sameFormValues(formData, savedFormData), busy)

  const editingAddress = useMemo(
    () => addresses.find((address) => address.id === editingAddressId) ?? null,
    [addresses, editingAddressId]
  )
  const canAddAddress = addresses.length < 5 || Boolean(editingAddress)

  function refreshAddresses() {
    setRetryCount((current) => current + 1)
  }
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
        const data = await getAddresses()
        if (!isActive) return
        setAddresses((current) => preserveAddressOrder(current, data))
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
      editorVersion.current += 1
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, checkTokens)
    }
  }, [retryCount])

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const field = event.currentTarget.name as AddressField
    const rawValue = event.currentTarget.value
    const value = field === "phone" ? formatPhoneNumber(rawValue) : rawValue

    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }))
    setMessage(null)
  }

  async function startEdit(address: Address) {
    if (editingAddressId === address.id || !(await guard.confirmDiscard())) return
    const version = ++editorVersion.current
    setPendingAddressId(address.id)
    setFieldErrors({})
    setMessage(null)

    try {
      const latestAddress = await getAddress(address.id)
      if (version !== editorVersion.current) return

      setEditingAddressId(latestAddress.id)
      const data = {
        recipient: latestAddress.recipient,
        phone: latestAddress.phone,
        zipcode: latestAddress.zipcode,
        addressLine1: latestAddress.addressLine1,
        addressLine2: latestAddress.addressLine2,
      }
      setFormData(data)
      setSavedFormData(data)
    } catch (error) {
      if (version === editorVersion.current) {
        setMessageTone("error")
        setMessage(getAddressErrorMessage(error))
      }
    } finally {
      if (version === editorVersion.current) setPendingAddressId(null)
    }
  }

  function resetForm() {
    editorVersion.current += 1
    setEditingAddressId(null)
    setFormData(emptyFormData)
    setSavedFormData(emptyFormData)
    setFieldErrors({})
    setMessage(null)
  }

  function handleAddressSearch() {
    if (busy) return
    const version = editorVersion.current
    if (!window.daum?.Postcode) {
      setMessageTone("error")
      setMessage("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.")
      return
    }

    const postcode = new window.daum.Postcode({
      oncomplete(data) {
        if (version !== editorVersion.current) return
        const baseAddress =
          data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress
        const extraAddressParts = []

        if (
          data.userSelectedType === "R" &&
          data.bname &&
          /[동로가]$/u.test(data.bname)
        ) {
          extraAddressParts.push(data.bname)
        }

        if (
          data.userSelectedType === "R" &&
          data.buildingName &&
          data.apartment === "Y"
        ) {
          extraAddressParts.push(data.buildingName)
        }

        const addressLine1 = extraAddressParts.length
          ? `${baseAddress} (${extraAddressParts.join(", ")})`
          : baseAddress

        setFormData((current) => ({
          ...current,
          zipcode: data.zonecode,
          addressLine1,
        }))
        setFieldErrors((current) => ({
          ...current,
          zipcode: undefined,
          addressLine1: undefined,
        }))
        setMessage(null)

        window.requestAnimationFrame(() => {
          detailAddressRef.current?.focus()
        })
      },
    })

    postcode.open()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget

    const payload = normalizeFormData(formData)
    const nextErrors = validateAddress(payload)

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setMessageTone("error")
      setMessage("입력 값을 다시 확인해 주세요.")
      focusFormError(form, "address-message")
      return
    }

    if (!canAddAddress) {
      setMessageTone("error")
      setMessage("배송지는 최대 5개까지 등록할 수 있습니다.")
      return
    }

    setIsSubmitting(true)
    editorVersion.current += 1
    setFieldErrors({})
    setMessage(null)

    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, payload)
        refreshAddresses()
        setMessage("배송지를 수정했습니다.")
      } else {
        await createAddress(payload)
        refreshAddresses()
        setMessage("배송지를 등록했습니다.")
      }

      setMessageTone("success")
      setFormData(emptyFormData)
      setSavedFormData(emptyFormData)
      setEditingAddressId(null)
    } catch (error) {
      if (error instanceof ApiError && error.errors?.length) {
        setFieldErrors(
          validationErrorsToFieldMap(error.errors) as FieldErrors
        )
      }

      setMessageTone("error")
      setMessage(getAddressErrorMessage(error))
      focusFormError(form, "address-message")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSetDefault(addressId: number) {
    if (busy) return
    setPendingAddressId(addressId)
    setMessage(null)

    try {
      await setDefaultAddress(addressId)
      refreshAddresses()
      setMessageTone("success")
      setMessage("기본 배송지를 변경했습니다.")
    } catch (error) {
      setMessageTone("error")
      setMessage(getAddressErrorMessage(error))
    } finally {
      setPendingAddressId(null)
    }
  }

  async function handleDelete(addressId: number) {
    if (busy) return
    if (!(await confirmAction({
      title: `${addresses.find((address) => address.id === addressId)?.recipient ?? "선택한 수령인"} 님 배송지 삭제`,
      description: `${addresses.find((address) => address.id === addressId)?.addressLine1 ?? "선택한 주소"} 배송지를 삭제합니다. 삭제한 배송지는 복구되지 않으며 다시 등록해야 합니다.${editingAddressId === addressId ? " 현재 편집 중인 내용도 함께 버립니다." : ""}`,
      confirmLabel: "배송지 삭제",
    }))) return
    setPendingAddressId(addressId)
    setMessage(null)

    try {
      await deleteAddress(addressId)
      refreshAddresses()

      if (editingAddressId === addressId) {
        resetForm()
      }

      setMessageTone("success")
      setMessage("배송지를 삭제했습니다.")
    } catch (error) {
      setMessageTone("error")
      setMessage(getAddressErrorMessage(error))
    } finally {
      setPendingAddressId(null)
    }
  }

  return (
    <main className="account-page flex min-h-screen flex-col bg-neutral-50 text-neutral-950">
      <Script
        id="daum-postcode-script"
        src="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onReady={() => setIsPostcodeReady(true)}
        onError={() => {
          setIsPostcodeReady(false)
          setMessageTone("error")
          setMessage("주소 검색 서비스를 불러오지 못했습니다.")
        }}
      />
      <SiteHeader />
      <div className="mx-auto w-full max-w-[1320px] flex-1 px-6 py-12">

        <section className="mb-8">
          <h1 className="text-4xl font-bold">배송지 관리</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            주문에 사용할 배송지를 등록하고 기본 배송지를 지정합니다.
          </p>
        </section>

        {status === "checking" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
            배송지 정보를 확인하고 있습니다.
          </section>
        )}

        {status === "error" && (
          <LoadError title="배송지 목록을 불러오지 못했습니다." error={loadError} onRetry={() => setRetryCount((current) => current + 1)} loginHref="/login?redirect=/me/addresses" />
        )}

        {status === "guest" && (
          <section className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
              <MapPin className="size-6 text-neutral-500" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">로그인이 필요합니다.</h2>
            <p className="mt-3 text-sm text-neutral-600">
              배송지 관리는 로그인 후 이용할 수 있습니다.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/login?redirect=/me/addresses">로그인하기</Link>
            </Button>
          </section>
        )}

        {status === "ready" && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="flex flex-col gap-4">
              {message && (
                <p id="address-message" tabIndex={-1}
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

              {addresses.length === 0 && (
                <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
                    <MapPin className="size-6 text-neutral-500" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold">
                    등록된 배송지가 없습니다.
                  </h2>
                  <p className="mt-3 text-sm text-neutral-600">
                    첫 배송지를 등록하면 기본 배송지로 사용됩니다.
                  </p>
                </div>
              )}

              {addresses.map((address) => {
                return (
                  <article
                    key={address.id}
                    className={cn(
                      "rounded-lg border p-5 shadow-sm",
                      address.isDefault
                        ? "border-neutral-950 bg-neutral-100 ring-2 ring-neutral-950/10"
                        : "border-neutral-200 bg-white"
                    )}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold">
                            {address.recipient}
                          </h2>
                          {address.isDefault && (
                            <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-medium text-white">
                              기본 배송지
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-neutral-600">
                          {address.phone}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-neutral-700">
                          [{address.zipcode}] {address.addressLine1}
                          {address.addressLine2 && (
                            <>
                              <br />
                              {address.addressLine2}
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!address.isDefault && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            aria-label={`${address.recipient} ${address.addressLine1} ${address.addressLine2 ?? ""} 배송지 기본 설정`}
                            onClick={() => handleSetDefault(address.id)}
                          >
                            <Check data-icon="inline-start" />
                            기본 설정
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          aria-label={`${address.recipient} ${address.addressLine1} ${address.addressLine2 ?? ""} 배송지 수정`}
                          onClick={() => void startEdit(address)}
                        >
                          <Pencil data-icon="inline-start" />
                          수정
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          aria-label={`${address.recipient} ${address.addressLine1} ${address.addressLine2 ?? ""} 배송지 삭제`}
                          onClick={() => handleDelete(address.id)}
                        >
                          <Trash2 data-icon="inline-start" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">
                    {editingAddress ? "배송지 수정" : "배송지 등록"}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {addresses.length}/5개 등록됨
                  </p>
                </div>
                {editingAddress && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={async () => { if (await guard.confirmDiscard()) resetForm() }}
                  >
                    취소
                  </Button>
                )}
              </div>

              {!canAddAddress && (
                <p className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
                  배송지는 최대 5개까지 등록할 수 있습니다.
                </p>
              )}

              <form noValidate aria-label="배송지 정보" className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
                <AddressInput
                  label="수령인"
                  name="recipient"
                  value={formData.recipient}
                  placeholder="홍길동"
                  error={fieldErrors.recipient}
                  disabled={!canAddAddress || busy}
                  onChange={handleInputChange}
                />
                <AddressInput
                  label="연락처"
                  name="phone"
                  value={formData.phone}
                  placeholder="010-1234-5678"
                  error={fieldErrors.phone}
                  disabled={!canAddAddress || busy}
                  onChange={handleInputChange}
                />
                <AddressInput
                  label="우편번호"
                  name="zipcode"
                  value={formData.zipcode}
                  placeholder="주소 검색으로 입력"
                  error={fieldErrors.zipcode}
                  disabled={!canAddAddress || busy}
                  readOnly
                  onClick={handleAddressSearch}
                  onChange={handleInputChange}
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10"
                      disabled={!canAddAddress || busy || !isPostcodeReady}
                      onClick={handleAddressSearch}
                    >
                      <Search data-icon="inline-start" />
                      주소 검색
                    </Button>
                  }
                />
                <AddressInput
                  label="주소"
                  name="addressLine1"
                  value={formData.addressLine1}
                  placeholder="주소 검색 결과"
                  error={fieldErrors.addressLine1}
                  disabled={!canAddAddress || busy}
                  readOnly
                  onClick={handleAddressSearch}
                  onChange={handleInputChange}
                />
                <AddressInput
                  label="상세 주소"
                  name="addressLine2"
                  value={formData.addressLine2}
                  placeholder="101동 1001호"
                  error={fieldErrors.addressLine2}
                  disabled={!canAddAddress || busy}
                  inputRef={detailAddressRef}
                  onChange={handleInputChange}
                />

                <Button
                  type="submit"
                  disabled={!canAddAddress || busy}
                  className="w-full"
                >
                  <Plus data-icon="inline-start" />
                  {isSubmitting
                    ? "저장 중"
                    : editingAddress
                      ? "수정하기"
                      : "등록하기"}
                </Button>
              </form>
            </aside>
          </section>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}

function AddressInput({
  label,
  name,
  value,
  placeholder,
  error,
  disabled,
  readOnly = false,
  inputRef,
  action,
  onClick,
  onChange,
}: {
  label: string
  name: AddressField
  value: string
  placeholder: string
  error?: string
  disabled: boolean
  readOnly?: boolean
  inputRef?: RefObject<HTMLInputElement | null>
  action?: ReactNode
  onClick?: () => void
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const inputId = `address-${name}`
  const errorId = `${inputId}-error`

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required
          aria-required="true"
          type={name === "phone" ? "tel" : "text"}
          autoComplete={addressAutoComplete[name]}
          inputMode={name === "phone" ? "tel" : name === "zipcode" ? "numeric" : undefined}
          className={cn(
            inputClassName,
            readOnly && "cursor-pointer bg-neutral-50"
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onClick={onClick}
          onChange={onChange}
        />
        {action}
      </div>
      {error && (
        <p id={errorId} className={fieldErrorClassName}>
          {error}
        </p>
      )}
    </div>
  )
}

function normalizeFormData(formData: AddressFormData): AddressFormData {
  return {
    recipient: formData.recipient.trim(),
    phone: formatPhoneNumber(formData.phone),
    zipcode: formData.zipcode.trim(),
    addressLine1: formData.addressLine1.trim(),
    addressLine2: formData.addressLine2.trim(),
  }
}

function preserveAddressOrder(current: Address[], next: Address[]) {
  const nextById = new Map(next.map((address) => [address.id, address]))
  const currentIds = new Set(current.map((address) => address.id))
  const orderedAddresses = current.flatMap((address) => {
    const nextAddress = nextById.get(address.id)

    return nextAddress ? [nextAddress] : []
  })
  const newAddresses = next.filter((address) => !currentIds.has(address.id))

  return [...orderedAddresses, ...newAddresses]
}

function formatPhoneNumber(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11)

  if (numbers.length <= 3) {
    return numbers
  }

  if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  }

  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
}

function validateAddress(values: AddressFormData) {
  const errors: FieldErrors = {}

  if (!values.recipient) {
    errors.recipient = "수령인을 입력해 주세요."
  }

  if (!values.phone) {
    errors.phone = "연락처를 입력해 주세요."
  } else if (!/^010-?\d{4}-?\d{4}$/.test(values.phone)) {
    errors.phone = "010-1234-5678 또는 01012345678 형식으로 입력해 주세요."
  }

  if (!values.zipcode) {
    errors.zipcode = "우편번호를 입력해 주세요."
  } else if (!/^\d{5}$/.test(values.zipcode)) {
    errors.zipcode = "우편번호는 5자리 숫자로 입력해 주세요."
  }

  if (!values.addressLine1) {
    errors.addressLine1 = "주소를 입력해 주세요."
  }

  if (!values.addressLine2) {
    errors.addressLine2 = "상세 주소를 입력해 주세요."
  }

  return errors
}

function getAddressErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  return "배송지 요청을 처리하지 못했습니다."
}
