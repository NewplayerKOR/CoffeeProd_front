"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useModalDialog } from "@/components/use-modal-dialog"

type ConfirmActionOptions = {
  title: string
  description: string
  confirmLabel: string
}
type Request = ConfirmActionOptions & { resolve: (value: boolean) => void }
let listener: ((request: Request) => void) | null = null
let pending = false

export function confirmAction(options: ConfirmActionOptions | string): Promise<boolean> {
  if (!listener || pending) return Promise.resolve(false)
  pending = true
  return new Promise((resolve) => {
    const content = typeof options === "string"
      ? { title: "계속 진행할까요?", description: options, confirmLabel: "확인" }
      : options
    listener?.({ ...content, resolve: (value) => { pending = false; resolve(value) } })
  })
}

export function ConfirmActionDialog() {
  const dialog = useRef<HTMLDialogElement>(null)
  const active = useRef<Request | null>(null)
  const [request, setRequest] = useState<Request | null>(null)
  useModalDialog(dialog, request !== null)

  function finish(value: boolean) {
    const request = active.current
    if (!request) return
    active.current = null
    dialog.current?.close()
    setRequest(null)
    request.resolve(value)
  }

  useEffect(() => {
    listener = (request) => {
      active.current = request
      setRequest(request)
    }
    return () => {
      listener = null
      active.current?.resolve(false)
      active.current = null
    }
  }, [])

  return (
    <dialog ref={dialog} aria-labelledby="confirm-title" aria-describedby="confirm-description"
      className="app-modal-dialog"
      onClose={() => { if (!dialog.current?.open) finish(false) }}
      onCancel={(event) => { event.preventDefault(); finish(false) }}>
      <h2 id="confirm-title" className="text-lg font-semibold">{request?.title}</h2>
      <p id="confirm-description" className="mt-3 text-sm leading-6">{request?.description}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button data-modal-autofocus variant="outline" onClick={() => finish(false)}>취소</Button>
        <Button variant="destructive" onClick={() => finish(true)}>{request?.confirmLabel}</Button>
      </div>
    </dialog>
  )
}
