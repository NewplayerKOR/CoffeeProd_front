"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

type Request = { description: string; resolve: (value: boolean) => void }
let listener: ((request: Request) => void) | null = null
let pending = false

export function confirmAction(description: string): Promise<boolean> {
  if (!listener || pending) return Promise.resolve(false)
  pending = true
  return new Promise((resolve) => {
    listener?.({ description, resolve: (value) => { pending = false; resolve(value) } })
  })
}

export function ConfirmActionDialog() {
  const dialog = useRef<HTMLDialogElement>(null)
  const active = useRef<Request | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const [description, setDescription] = useState("")

  function finish(value: boolean) {
    const request = active.current
    active.current = null
    dialog.current?.close()
    trigger.current?.focus({ preventScroll: true })
    request?.resolve(value)
  }

  useEffect(() => {
    listener = (request) => {
      active.current = request
      trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setDescription(request.description)
      dialog.current?.showModal()
    }
    return () => {
      listener = null
      active.current?.resolve(false)
      active.current = null
    }
  }, [])

  return (
    <dialog ref={dialog} aria-labelledby="confirm-title" aria-describedby="confirm-description"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-background p-6 text-foreground shadow-xl backdrop:bg-black/50"
      onCancel={(event) => { event.preventDefault(); finish(false) }}>
      <h2 id="confirm-title" className="text-lg font-semibold">계속 진행할까요?</h2>
      <p id="confirm-description" className="mt-3 text-sm leading-6">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button autoFocus variant="outline" onClick={() => finish(false)}>취소</Button>
        <Button variant="destructive" onClick={() => finish(true)}>확인</Button>
      </div>
    </dialog>
  )
}
