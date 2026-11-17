"use client"

import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react"

import { Button } from "@/components/ui/button"

export function SiteMobileMenu({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return <MobileMenuDisclosure key={pathname}>{children}</MobileMenuDisclosure>
}

function MobileMenuDisclosure({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) trigger.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!open) return
    const desktop = window.matchMedia("(min-width: 1025px)")
    function outsideClick(event: MouseEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) {
        close(document.activeElement === document.body || Boolean(container.current?.contains(document.activeElement)))
      }
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault()
        close(document.activeElement === document.body || Boolean(container.current?.contains(document.activeElement)))
      }
    }
    function resize() {
      if (!desktop.matches) return
      const focusWasInside = document.activeElement === document.body || container.current?.contains(document.activeElement)
      close(false)
      if (focusWasInside) {
        container.current?.closest("header")?.querySelector<HTMLElement>(".site-wordmark")?.focus({ preventScroll: true })
      }
    }
    document.addEventListener("click", outsideClick)
    document.addEventListener("keydown", escape)
    desktop.addEventListener("change", resize)
    return () => {
      document.removeEventListener("click", outsideClick)
      document.removeEventListener("keydown", escape)
      desktop.removeEventListener("change", resize)
    }
  }, [open, close])

  return (
    <div
      ref={container}
      className="site-mobile-menu"
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) close(false)
      }}
    >
      <Button
        ref={trigger}
        type="button"
        variant="ghost"
        size="icon"
        className="site-mobile-menu-trigger"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X /> : <Menu />}
      </Button>
      <div
        id={panelId}
        hidden={!open}
        className="site-mobile-menu-panel"
        onClick={(event) => {
          const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null
          if (link) close(link.href === window.location.href || event.ctrlKey || event.metaKey || event.shiftKey || link.target === "_blank")
        }}
      >
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => close()}>
            메뉴 닫기<X data-icon="inline-end" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
