import { apiRequest, API_BASE_URL } from "./client"
import type { AuthTokens } from "./auth-token-storage"

export type OAuthProvider = "google" | "kakao"
export type OAuthResult = {
  status: "LOGIN" | "SIGNUP" | "LINK_PROOF" | "LINK_CONFIRM" | "WITHDRAW_CONFIRM"
  tokens?: AuthTokens
  email?: string
  emailVerified?: boolean
  provider?: OAuthProvider
  confirmation?: string
}

export function oauthRequest<T>(path: string, body?: unknown, auth = true) {
  return apiRequest<T>(`/api/v1/auth/oauth${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    headers: { "X-OAuth-Request": "1" },
    body,
    retryOnUnauthorized: false,
    cache: "no-store",
    auth,
  })
}

export async function startOAuth(provider: OAuthProvider, options: {
  purpose: "LOGIN" | "LINK" | "WITHDRAW"
  currentPassword?: string
  confirmation?: string
  reauthenticate?: boolean
}) {
  const result = await oauthRequest<{ authorizationUrl: string }>(`/${provider}/start`, options, options.purpose !== "LOGIN")
  const url = new URL(result.authorizationUrl)
  if (url.origin !== new URL(API_BASE_URL).origin || url.pathname !== `/oauth2/authorization/${provider}`) {
    throw new Error("인증 주소를 확인하지 못했습니다.")
  }
  sessionStorage.setItem("coffeeprod.oauth.intent", options.purpose)
  window.location.assign(url.href)
}

export function oauthError(error: unknown) {
  return error instanceof Error ? error.message : "인증을 완료하지 못했습니다. 다시 시도해 주세요."
}
