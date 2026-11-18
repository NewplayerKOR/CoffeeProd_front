"use client"

import {
  createContext, useCallback, useContext, useEffect, useId, useLayoutEffect,
  useMemo, useRef, useState, type ReactNode,
} from "react"

import { confirmAction } from "@/components/confirm-action"

type Guard = { group: string; label: string; dirty: boolean; busy: boolean }
type GuardContext = {
  register: (id: string, guard: Guard) => () => void
  confirmDiscard: (group?: string) => Promise<boolean>
  markSaved: (id: string) => void
}
const Context = createContext<GuardContext | null>(null)
const historyIndexKey = "coffeeprod.navigationIndex"

export function sameFormValues(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const guards = useRef(new Map<string, Guard>())
  const allowUnload = useRef(false)
  const [blocked, setBlocked] = useState(false)
  const [busyNotice, setBusyNotice] = useState(false)

  const syncBlocked = useCallback(() => {
    const current = [...guards.current.values()]
    setBlocked(current.some((guard) => guard.dirty || guard.busy))
    if (!current.some((guard) => guard.busy)) setBusyNotice(false)
  }, [])
  const register = useCallback((id: string, guard: Guard) => {
    guards.current.set(id, guard)
    syncBlocked()
    return () => { guards.current.delete(id); syncBlocked() }
  }, [syncBlocked])
  const markSaved = useCallback((id: string) => {
    const guard = guards.current.get(id)
    if (guard) guards.current.set(id, { ...guard, dirty: false, busy: false })
    syncBlocked()
  }, [syncBlocked])
  const confirmDiscard = useCallback(async (group?: string) => {
    const targets = [...guards.current.values()].filter((guard) => !group || guard.group === group)
    if (targets.some((guard) => guard.busy)) {
      setBusyNotice(true)
      return false
    }
    const changed = targets.filter((guard) => guard.dirty)
    if (!changed.length) return true
    return confirmAction({
      title: "저장하지 않은 내용을 버릴까요?",
      description: `${[...new Set(changed.map((guard) => guard.label))].join(", ")}의 변경 내용을 저장하지 않았습니다. 버리면 되돌릴 수 없습니다. 취소하면 계속 편집할 수 있습니다.`,
      confirmLabel: "변경 내용 버리기",
    })
  }, [])

  useEffect(() => {
    if (!busyNotice) return
    const timer = window.setTimeout(() => setBusyNotice(false), 4000)
    return () => window.clearTimeout(timer)
  }, [busyNotice])

  useEffect(() => {
    if (!blocked) return
    function beforeUnload(event: BeforeUnloadEvent) {
      if (allowUnload.current || ![...guards.current.values()].some((guard) => guard.dirty || guard.busy)) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", beforeUnload)
    return () => window.removeEventListener("beforeunload", beforeUnload)
  }, [blocked])

  useEffect(() => {
    const history = window.history
    const originalPush = history.pushState.bind(history)
    const originalReplace = history.replaceState.bind(history)
    let currentIndex = readIndex(history.state) ?? 0
    let currentUrl = location.href
    let replayLink = false
    let disposed = false
    let traversal: { from: number; to: number; phase: "restoring" | "confirming" | "leaving" } | null = null
    const hasChanges = () => [...guards.current.values()].some((guard) => guard.dirty || guard.busy)
    const withIndex = (data: unknown, index: number) => ({
      ...(data && typeof data === "object" ? data : {}), [historyIndexKey]: index,
    })

    // Next의 history 상태를 보존하고 위치 번호만 덧붙인다. 입력값은 기록하지 않는다.
    originalReplace(withIndex(history.state, currentIndex), "", location.href)
    history.pushState = (data: unknown, unused: string, url?: string | URL | null) => {
      originalPush(withIndex(data, ++currentIndex), unused, url)
      currentUrl = location.href
    }
    history.replaceState = (data: unknown, unused: string, url?: string | URL | null) => {
      originalReplace(withIndex(data, currentIndex), unused, url)
      currentUrl = location.href
    }

    async function click(event: MouseEvent) {
      if (replayLink || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !hasChanges()) return
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return
      const target = new URL(anchor.href)
      if (!["http:", "https:"].includes(target.protocol) || samePage(target.href, location.href)) return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (!(await confirmDiscard()) || disposed || !anchor.isConnected) return
      replayLink = true
      allowUnload.current = true
      try { anchor.click() } finally {
        replayLink = false
        window.setTimeout(() => { allowUnload.current = false }, 0)
      }
    }

    function popState(event: PopStateEvent) {
      const targetIndex = readIndex(event.state)
      if (targetIndex === null) return
      if (traversal?.phase === "leaving" && targetIndex === traversal.to) {
        currentIndex = targetIndex
        currentUrl = location.href
        traversal = null
        return
      }
      if (traversal) {
        event.stopImmediatePropagation()
        if (targetIndex !== traversal.from) {
          history.go(traversal.from - targetIndex)
        } else if (traversal.phase === "restoring") {
          traversal.phase = "confirming"
          const request = traversal
          void confirmDiscard().then((accepted) => {
            if (disposed || traversal !== request) return
            if (accepted) { request.phase = "leaving"; history.go(request.to - request.from) }
            else traversal = null
          })
        }
        return
      }
      if (!hasChanges() || samePage(currentUrl, location.href) || targetIndex === currentIndex) {
        currentIndex = targetIndex
        currentUrl = location.href
        return
      }
      // popstate는 취소할 수 없어 원래 위치로 복귀한 뒤 사용자 선택을 받는다.
      event.stopImmediatePropagation()
      traversal = { from: currentIndex, to: targetIndex, phase: "restoring" }
      history.go(currentIndex - targetIndex)
    }

    document.addEventListener("click", click, true)
    window.addEventListener("popstate", popState, true)
    return () => {
      disposed = true
      document.removeEventListener("click", click, true)
      window.removeEventListener("popstate", popState, true)
      history.pushState = originalPush
      history.replaceState = originalReplace
    }
  }, [confirmDiscard])

  const value = useMemo(() => ({ register, confirmDiscard, markSaved }), [register, confirmDiscard, markSaved])
  return (
    <Context.Provider value={value}>
      {busyNotice && <p role="status" className="border-b border-neutral-200 bg-neutral-100 px-6 py-3 text-sm">요청을 처리하고 있습니다. 처리가 끝난 뒤 다시 이동해 주세요.</p>}
      {children}
    </Context.Provider>
  )
}

export function useUnsavedChanges(group: string, label: string, dirty: boolean, busy = false) {
  const context = useContext(Context)
  const id = useId()
  if (!context) throw new Error("UnsavedChangesProvider가 필요합니다.")
  const { register, confirmDiscard, markSaved } = context
  useLayoutEffect(() => register(id, { group, label, dirty, busy }), [register, id, group, label, dirty, busy])
  return {
    confirmDiscard: () => confirmDiscard(group),
    markSaved: () => markSaved(id),
  }
}

export function useConfirmNavigation() {
  const context = useContext(Context)
  if (!context) throw new Error("UnsavedChangesProvider가 필요합니다.")
  return context.confirmDiscard
}

function readIndex(state: unknown): number | null {
  if (!state || typeof state !== "object") return null
  const index = (state as Record<string, unknown>)[historyIndexKey]
  return typeof index === "number" && Number.isInteger(index) ? index : null
}

function samePage(left: string, right: string) {
  const a = new URL(left), b = new URL(right)
  return a.origin === b.origin && a.pathname === b.pathname && a.search === b.search
}
