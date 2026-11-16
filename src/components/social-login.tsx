"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { oauthRequest, startOAuth, oauthError, type OAuthProvider } from "@/lib/api/oauth"

export function SocialLogin() {
  const [providers, setProviders] = useState<OAuthProvider[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    oauthRequest<{ enabled: OAuthProvider[] }>("/providers", undefined, false).then(data => {
      if (active) setProviders(data.enabled)
    }).catch(() => { if (active) setError("소셜 로그인 서비스를 사용할 수 없습니다.") })
    return () => { active = false }
  }, [])
  return <div className="mt-5 flex flex-col gap-3">
    {providers.map(provider => <Button key={provider} type="button" variant="outline" disabled={busy} onClick={async () => {
      setBusy(true); setError("")
      try { await startOAuth(provider, { purpose: "LOGIN" }) }
      catch (error) { setError(oauthError(error)); setBusy(false) }
    }}>{provider === "google" ? "Google" : "카카오"}로 로그인</Button>)}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </div>
}
