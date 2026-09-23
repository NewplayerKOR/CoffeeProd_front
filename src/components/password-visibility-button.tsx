"use client"

import { Eye, EyeOff } from "lucide-react"

export function PasswordVisibilityButton({
  inputId,
  label,
  visible,
  disabled = false,
  onToggle,
}: {
  inputId: string
  label: string
  visible: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  const action = `${label} ${visible ? "숨기기" : "표시"}`

  return (
    <button
      type="button"
      className="grid size-11 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label={action}
      aria-controls={inputId}
      aria-pressed={visible}
      title={action}
      disabled={disabled}
      onClick={onToggle}
    >
      {visible
        ? <EyeOff className="size-4" aria-hidden="true" />
        : <Eye className="size-4" aria-hidden="true" />}
    </button>
  )
}
