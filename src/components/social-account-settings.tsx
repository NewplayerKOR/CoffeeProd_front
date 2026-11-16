"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { oauthRequest, startOAuth, oauthError, type OAuthProvider } from "@/lib/api/oauth"

export function SocialAccountSettings({ hasLocalPassword }: { hasLocalPassword: boolean }) {
  const [enabled, setEnabled] = useState<OAuthProvider[]>([])
  const [connected, setConnected] = useState<OAuthProvider[]>([])
  const [password, setPassword] = useState("")
  const [proof, setProof] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    oauthRequest<{ enabled: OAuthProvider[]; connected: OAuthProvider[] }>("/providers").then(data => {
      if (active) { setEnabled(data.enabled); setConnected(data.connected); setProof(sessionStorage.getItem("coffeeprod.oauth.linkProof") ?? "") }
    }).catch(error => { if (active) setError(oauthError(error)) })
    return () => { active = false }
  }, [])
  async function start(provider: OAuthProvider, purpose: "LINK" | "WITHDRAW", reauthenticate = false) {
    setBusy(true); setError("")
    try { await startOAuth(provider, { purpose, reauthenticate, currentPassword: password, confirmation: proof }) }
    catch (error) {
      setError(oauthError(error)); setBusy(false)
      if (!hasLocalPassword) { setProof(""); sessionStorage.removeItem("coffeeprod.oauth.linkProof") }
    }
  }
  return <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-5">
    <h2 className="text-lg font-bold">소셜 계정 관리</h2>
    <p>연결된 계정: {connected.map(p => p === "google" ? "Google" : "카카오").join(", ") || "없음"}</p>
    {hasLocalPassword && <label>계정 연결을 위한 현재 비밀번호<input className="mt-2 w-full rounded border p-2" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>}
    {!hasLocalPassword && !proof && connected.filter(p => enabled.includes(p)).map(provider => <Button key={provider} variant="outline" disabled={busy} onClick={() => start(provider, "LINK", true)}>{provider === "google" ? "Google" : "카카오"}로 계정 연결 본인 확인</Button>)}
    {enabled.filter(p => !connected.includes(p)).map(provider => <Button key={provider} variant="outline" disabled={busy || (!hasLocalPassword && !proof)} onClick={() => start(provider, "LINK")}>{provider === "google" ? "Google" : "카카오"} 계정 연결</Button>)}
    {!hasLocalPassword && connected.filter(p => enabled.includes(p)).map(provider => <Button key={provider} variant="destructive" disabled={busy} onClick={() => start(provider, "WITHDRAW")}>{provider === "google" ? "Google" : "카카오"} 재인증 후 회원 탈퇴</Button>)}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </section>
}
