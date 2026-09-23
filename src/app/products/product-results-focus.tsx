"use client"

import { useEffect } from "react"

export function ProductResultsFocus({ page }: { page: number }) {
  useEffect(() => {
    if (window.location.hash !== "#catalog-results") return
    const results = document.getElementById("catalog-results")
    results?.focus({ preventScroll: true })
    results?.scrollIntoView({ block: "start" })
  }, [page])
  return null
}
