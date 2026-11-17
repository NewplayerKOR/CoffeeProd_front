import { useLayoutEffect, useState } from "react"

type FocusRequest = { container: HTMLElement | null; fallbackId?: string }

export function useFormErrorFocus() {
  const [request, setRequest] = useState<FocusRequest | null>(null)

  useLayoutEffect(() => {
    // 오류 설명과 비활성 상태를 반영한 commit에서 초점을 옮긴다.
    if (!request?.container?.isConnected) return
    const { container, fallbackId } = request
    const field = container.querySelector<HTMLElement>([
      'input[aria-invalid="true"]:not(:disabled)',
      'select[aria-invalid="true"]:not(:disabled)',
      'textarea[aria-invalid="true"]:not(:disabled)',
      'button[aria-invalid="true"]:not(:disabled)',
      '[role="group"][data-invalid="true"]',
    ].join(", "))
    const summary = container.querySelector<HTMLElement>("[data-form-error]")
      ?? (fallbackId ? document.getElementById(fallbackId) : null)
    const target = field ?? summary
    target?.focus()
  }, [request])

  return (container: HTMLElement | null, fallbackId?: string) => {
    setRequest({ container, fallbackId })
  }
}

export function getNumberInputErrors(form: HTMLFormElement) {
  const errors: Record<string, string> = {}
  for (const input of form.querySelectorAll<HTMLInputElement>('input[type="number"]')) {
    const { badInput, stepMismatch, rangeUnderflow, rangeOverflow } = input.validity
    if (badInput || stepMismatch || rangeUnderflow || rangeOverflow) {
      errors[input.name] = "입력 가능한 범위와 숫자 형식을 확인해 주세요."
    }
  }
  return errors
}
