"use client"

import Link from "next/link"
import { useRef, useState, type FormEvent } from "react"
import { apiRequest } from "@/lib/api/client"
import { clearStoredAuthTokens } from "@/lib/api/auth-token-storage"

const notice = "복구 가능한 계정이면 가입 이메일로 인증번호를 보냅니다. 소셜 가입 회원은 연결된 소셜 로그인을 이용해 주세요."
function request<T>(path: string, body: unknown) {
  return apiRequest<T>(`/api/v1/auth/password-reset/${path}`, { method: "POST", body, auth: false, retryOnUnauthorized: false, cache: "no-store", credentials: "omit" })
}
export default function PasswordResetPage() {
  const [step, setStep] = useState<"email" | "code" | "password" | "done">("email")
  const [email, setEmail] = useState("")
  const [transaction, setTransaction] = useState("")
  const [grant, setGrant] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [resendAt, setResendAt] = useState(0)
  const submitting = useRef(false)
  const codeInput = useRef<HTMLInputElement>(null)
  const passwordInput = useRef<HTMLInputElement>(null)
  const errorBox = useRef<HTMLParagraphElement>(null)
  const doneHeading = useRef<HTMLHeadingElement>(null)
  const input = "mt-2 min-h-12 w-full rounded-md border border-neutral-500 bg-transparent px-3 text-base"
  const button = "min-h-12 w-full rounded-md bg-neutral-950 px-4 py-3 font-semibold text-white disabled:opacity-50"

  async function perform(action: () => Promise<void>) {
    if (submitting.current) return
    submitting.current = true; setBusy(true); setError("")
    try { await action() }
    catch (failure) {
      setError(failure instanceof Error ? failure.message : "요청을 처리하지 못했습니다. 다시 시도해 주세요.")
      requestAnimationFrame(() => errorBox.current?.focus())
    } finally { submitting.current = false; setBusy(false) }
  }
  async function send() {
    const result = await request<{ transaction: string }>("send", { email: email.trim(), transaction: transaction || undefined })
    setTransaction(result.transaction); setCode(""); setMessage(notice); setResendAt(Date.now() + 60000); setStep("code")
    requestAnimationFrame(() => codeInput.current?.focus())
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void perform(async () => {
      if (step === "email") return send()
      if (step === "code") {
        const result = await request<{ grant: string }>("verify", { email: email.trim(), transaction, code })
        setGrant(result.grant); setCode(""); setMessage(""); setStep("password")
        requestAnimationFrame(() => passwordInput.current?.focus())
      } else if (step === "password") {
        if (password !== confirm) throw new Error("새 비밀번호와 확인이 일치하지 않습니다.")
        if (new TextEncoder().encode(password).length > 72) throw new Error("비밀번호는 UTF-8 기준 72바이트 이하로 입력해 주세요.")
        await request("reset", { email: email.trim(), transaction, grant, newPassword: password, confirmPassword: confirm })
        clearStoredAuthTokens(); setPassword(""); setConfirm(""); setGrant(""); setTransaction(""); setStep("done"); setMessage("")
        requestAnimationFrame(() => doneHeading.current?.focus())
      }
    })
  }
  function restart() {
    setStep("email"); setTransaction(""); setGrant(""); setCode(""); setPassword(""); setConfirm(""); setMessage(""); setError("")
  }
  return <main className="auth-page flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-10 text-neutral-950">
    <section className="auth-panel w-full max-w-md rounded-lg border border-neutral-200 bg-white p-7 shadow-sm">
      <Link href="/" className="site-wordmark mb-6 block text-center">CoffeeProd</Link>
      {step === "done" ? <>
        <h1 ref={doneHeading} tabIndex={-1} className="text-2xl font-bold">비밀번호 재설정 완료</h1>
        <p className="my-6 text-sm">기존 로그인은 종료되었습니다. 새 비밀번호로 다시 로그인해 주세요.</p>
        <Link href="/login" className={`${button} block text-center`}>로그인하기</Link>
      </> : <>
        <h1 id="reset-title" className="text-2xl font-bold">비밀번호 찾기</h1>
        <p className="my-4 text-sm text-neutral-600">{step === "email" ? "가입 이메일로 본인을 확인해 주세요." : step === "code" ? "이메일로 받은 6자리 인증번호를 5분 안에 입력해 주세요." : "새 비밀번호를 입력해 주세요. 인증 후 5분 안에 완료해야 합니다."}</p>
        <p className="mb-4 text-xs" aria-live="polite">{step === "email" ? "1 / 3 이메일 입력" : step === "code" ? "2 / 3 인증번호 확인" : "3 / 3 새 비밀번호 설정"}</p>
        <form onSubmit={submit} aria-labelledby="reset-title" className="space-y-5">
          {step === "email" ? <div><label htmlFor="reset-email">가입 이메일</label><input id="reset-email" name="email" type="email" autoComplete="username" spellCheck={false} required maxLength={100} value={email} onChange={e => setEmail(e.target.value)} className={input} /></div> : <p className="break-all text-sm">{email}</p>}
          {step === "code" ? <div><label htmlFor="reset-code">인증번호</label><input ref={codeInput} id="reset-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value)} className={input} /></div> : null}
          {step === "password" ? <>
            <div><label htmlFor="reset-password">새 비밀번호</label><input ref={passwordInput} id="reset-password" name="newPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={100} aria-describedby="password-help" value={password} onChange={e => setPassword(e.target.value)} className={input} /><p id="password-help" className="mt-2 text-xs">8~100자, UTF-8 기준 최대 72바이트</p></div>
            <div><label htmlFor="reset-confirm">새 비밀번호 확인</label><input id="reset-confirm" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={100} value={confirm} onChange={e => setConfirm(e.target.value)} className={input} /></div>
          </> : null}
          {message ? <p role="status" className="text-sm leading-6">{message}</p> : null}
          {error ? <p ref={errorBox} role="alert" tabIndex={-1} className="text-sm text-red-700">{error}</p> : null}
          <button type="submit" disabled={busy} className={button}>{busy ? "처리 중…" : step === "email" ? "인증번호 요청" : step === "code" ? "인증번호 확인" : "비밀번호 재설정"}</button>
        </form>
        {step === "code" ? <button type="button" disabled={busy} className="mt-4 min-h-12 w-full text-sm underline" onClick={() => void perform(async () => { if (Date.now() < resendAt) throw new Error("인증번호는 요청 후 60초가 지나면 다시 보낼 수 있습니다."); await send() })}>인증번호 다시 보내기</button> : null}
        {step !== "email" ? <button type="button" disabled={busy} className="min-h-12 w-full text-sm underline" onClick={restart}>이메일부터 다시 시작</button> : null}
        <Link href="/login" className="mt-4 block py-3 text-center text-sm underline">로그인으로 돌아가기</Link>
      </>}
    </section>
  </main>
}
