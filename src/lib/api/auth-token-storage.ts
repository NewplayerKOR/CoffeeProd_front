export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

const AUTH_TOKENS_STORAGE_KEY = "coffeeprod.auth.tokens"

export const AUTH_TOKENS_CHANGED_EVENT = "coffeeprod:auth-tokens-changed"

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function isAuthTokens(value: unknown): value is AuthTokens {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<AuthTokens>

  return (
    typeof candidate.accessToken === "string" &&
    candidate.accessToken.length > 0 &&
    typeof candidate.refreshToken === "string" &&
    candidate.refreshToken.length > 0
  )
}

export function getStoredAuthTokens(): AuthTokens | null {
  if (!canUseLocalStorage()) {
    return null
  }

  try {
    const rawTokens = window.localStorage.getItem(AUTH_TOKENS_STORAGE_KEY)

    if (!rawTokens) {
      return null
    }

    const parsedTokens: unknown = JSON.parse(rawTokens)

    if (!isAuthTokens(parsedTokens)) {
      clearStoredAuthTokens()
      return null
    }

    return parsedTokens
  } catch {
    clearStoredAuthTokens()
    return null
  }
}

export function setStoredAuthTokens(tokens: AuthTokens) {
  if (!canUseLocalStorage()) {
    return
  }

  window.localStorage.setItem(AUTH_TOKENS_STORAGE_KEY, JSON.stringify(tokens))
  window.dispatchEvent(new CustomEvent(AUTH_TOKENS_CHANGED_EVENT))
}

export function clearStoredAuthTokens() {
  if (!canUseLocalStorage()) {
    return
  }

  const hadTokens = window.localStorage.getItem(AUTH_TOKENS_STORAGE_KEY) !== null

  window.localStorage.removeItem(AUTH_TOKENS_STORAGE_KEY)

  if (hadTokens) {
    window.dispatchEvent(new CustomEvent(AUTH_TOKENS_CHANGED_EVENT))
  }
}

export function getStoredAccessToken() {
  return getStoredAuthTokens()?.accessToken ?? null
}

export function getStoredRefreshToken() {
  return getStoredAuthTokens()?.refreshToken ?? null
}
