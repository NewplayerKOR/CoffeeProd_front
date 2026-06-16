"use client"

import { Moon, Sun } from "lucide-react"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"

type ThemeMode = "light" | "dark"

const THEME_STORAGE_KEY = "coffeeprod.theme"
const THEME_CHANGE_EVENT = "coffeeprod:theme-change"

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  )

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark"

    document.documentElement.classList.add("theme-transition")
    document.documentElement.classList.toggle("dark", nextTheme === "dark")
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT))

    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-transition")
    }, 450)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "라이트 테마로 전환" : "다크 테마로 전환"}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  )
}

function subscribeTheme(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange)
  window.addEventListener("storage", onStoreChange)

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

function getThemeSnapshot(): ThemeMode {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function getServerThemeSnapshot(): ThemeMode {
  return "light"
}
