"use client"

import { type RefObject, useLayoutEffect } from "react"

export function useModalDialog(
  dialog: RefObject<HTMLDialogElement | null>,
  open = true
) {
  useLayoutEffect(() => {
    const element = dialog.current
    if (!element || !open) return
    // 클라이언트에서 생성한 창도 native 초기 초점 속성을 적용한 뒤 연다.
    element.querySelector("[data-modal-autofocus]")?.setAttribute("autofocus", "")
    element.showModal()
    return () => element.close()
  }, [dialog, open])
}
