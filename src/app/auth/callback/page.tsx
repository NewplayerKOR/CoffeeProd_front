"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { oauthRequest, oauthError, type OAuthResult } from "@/lib/api/oauth"
import { setStoredAuthTokens, clearStoredAuthTokens } from "@/lib/api/auth-token-storage"

export default function OAuthCallbackPage() {
  const router = useRouter()
  const exchange = useRef<Promise<OAuthResult> | null>(null)
  const [result, setResult] = useState<OAuthResult | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [nickname, setNickname] = useState("")
  const [code, setCode] = useState("")
  const [grant, setGrant] = useState("")

  useEffect(() => {
    let active = true
    exchange.current ??= oauthRequest<OAuthResult>("/exchange", {}, sessionStorage.getItem("coffeeprod.oauth.intent") !== "LOGIN")
    exchange.current.then(data => {
      if (!active) return
      if (data.status === "LOGIN" && data.tokens) {
        setStoredAuthTokens(data.tokens); router.replace("/"); return
      }
      if (data.status === "LINK_PROOF" && data.confirmation) {
        sessionStorage.setItem("coffeeprod.oauth.linkProof", data.confirmation)
        router.replace("/me"); return
      }
      setResult(data); setEmail(data.email ?? "")
    }).catch(error => { if (active) setError(oauthError(error)) })
    return () => { active = false }
  }, [router])

  async function action(run: () => Promise<void>) {
    if (busy) return
    setBusy(true); setError(""); setNotice("")
    try { await run() } catch (error) { setError(oauthError(error)) }
    finally { setBusy(false) }
  }
  async function signup(event: FormEvent) {
    event.preventDefault()
    await action(async () => {
      const tokens = await oauthRequest<{ accessToken: string; refreshToken: string }>("/signup", { email, name, nickname, grant }, false)
      setStoredAuthTokens(tokens); router.replace("/")
    })
  }
  const needsEmail = !result?.emailVerified || email !== result.email
  const inputClass = "w-full rounded border border-neutral-300 p-2"
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-6">
    <h1 className="text-2xl font-bold">소셜 인증</h1>
    {!result && !error && <p role="status">인증 결과를 확인하고 있습니다.</p>}
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {result?.status === "SIGNUP" && <form onSubmit={signup} className="flex flex-col gap-4">
      <p>가입 정보를 확인해 주세요. 기존 이메일과 같아도 계정은 자동으로 연결되지 않습니다.</p>
      <label>이메일<input className={inputClass} type="email" required maxLength={100} value={email} onChange={e => { setEmail(e.target.value); setGrant("") }} /></label>
      {needsEmail && <>
        <Button type="button" variant="outline" disabled={busy} onClick={() => action(async () => { await oauthRequest("/email/send", { email }, false); setNotice("인증번호를 발송했습니다. 5분 안에 입력해 주세요.") })}>인증번호 발송</Button>
        <label>인증번호<input className={inputClass} inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value)} /></label>
        <Button type="button" variant="outline" disabled={busy || code.length !== 6} onClick={() => action(async () => { const data = await oauthRequest<{ grant: string }>("/email/verify", { email, code }, false); setGrant(data.grant); setNotice("이메일을 확인했습니다.") })}>인증번호 확인</Button>
      </>}
      <label>이름<input className={inputClass} required maxLength={50} value={name} onChange={e => setName(e.target.value)} /></label>
      <label>닉네임<input className={inputClass} required maxLength={50} value={nickname} onChange={e => setNickname(e.target.value)} /></label>
      <Button type="submit" disabled={busy || (needsEmail && !grant)}>가입 완료</Button>
      <Link href="/login?redirect=/me" className="underline">기존 계정으로 로그인한 뒤 마이페이지에서 연결</Link>
    </form>}
    {result?.status === "LINK_CONFIRM" && <>
      <p>인증한 {result.provider === "google" ? "Google" : "카카오"} 계정을 현재 회원에 연결할까요?</p>
      <Button disabled={busy} onClick={() => action(async () => { await oauthRequest("/link", { confirmed: true }); sessionStorage.removeItem("coffeeprod.oauth.linkProof"); router.replace("/me") })}>계정 연결 확인</Button>
    </>}
    {result?.status === "WITHDRAW_CONFIRM" && <>
      <p>본인 확인을 마쳤습니다. 탈퇴하면 현재 계정으로 다시 로그인할 수 없습니다.</p>
      <Button variant="destructive" disabled={busy} onClick={() => action(async () => { await oauthRequest("/withdraw", { confirmed: true }); clearStoredAuthTokens(); sessionStorage.removeItem("coffeeprod.oauth.linkProof"); router.replace("/login") })}>회원 탈퇴 확인</Button>
    </>}
    <Link href="/login" className="underline">로그인으로 돌아가기</Link>
  </main>
}
