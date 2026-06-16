import {
  clearStoredAuthTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredAuthTokens,
  type AuthTokens,
} from "./auth-token-storage"
import {
  ApiError,
  type ApiErrorKind,
  type CommonResponse,
  type ValidationError,
} from "./types"

const DEFAULT_API_BASE_URL = "http://localhost:8080"

export const API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL
)

export const AUTH_EXPIRED_EVENT = "coffeeprod:auth-expired"

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>

export type QueryParams = Record<string, QueryValue>

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  query?: QueryParams
  auth?: boolean
  retryOnUnauthorized?: boolean
}

let pendingTokenRefresh: Promise<boolean> | null = null

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  try {
    return await requestOnce<T>(path, options)
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error
    }

    const shouldRetry =
      error.kind === "UNAUTHORIZED" &&
      options.auth !== false &&
      options.retryOnUnauthorized !== false

    if (!shouldRetry) {
      throw error
    }

    const refreshed = await refreshAccessToken()

    if (!refreshed) {
      notifyAuthExpired()
      throw error
    }

    return requestOnce<T>(path, {
      ...options,
      retryOnUnauthorized: false,
    })
  }
}

async function requestOnce<T>(
  path: string,
  options: ApiRequestOptions
): Promise<T> {
  const { auth = true, body, headers, query, ...fetchOptions } = options
  const url = buildUrl(path, query)
  const requestHeaders = new Headers(headers)
  const requestBody = serializeBody(body, requestHeaders)
  const accessToken = auth ? getStoredAccessToken() : null

  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`)
  }

  const requestInit: RequestInit = {
    ...fetchOptions,
    headers: requestHeaders,
  }

  if (requestBody !== undefined) {
    requestInit.body = requestBody
  }

  let response: Response

  try {
    response = await fetch(url, requestInit)
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError({
        kind: "NETWORK_ERROR",
        message: "요청이 취소되었습니다.",
        httpStatus: 0,
      })
    }

    throw new ApiError({
      kind: "NETWORK_ERROR",
      message: "서버에 연결할 수 없습니다.",
      httpStatus: 0,
    })
  }

  const envelope = await readCommonResponse<T>(response)
  const effectiveStatus = envelope.status || response.status

  if (!response.ok || effectiveStatus >= 400) {
    throw new ApiError({
      kind: resolveErrorKind(response.status, effectiveStatus, envelope.errors),
      message: envelope.message || "API 요청에 실패했습니다.",
      httpStatus: response.status,
      bodyStatus: envelope.status,
      errors: envelope.errors,
      data: envelope.data,
    })
  }

  return envelope.data
}

async function refreshAccessToken() {
  if (!pendingTokenRefresh) {
    pendingTokenRefresh = reissueAuthTokens().finally(() => {
      pendingTokenRefresh = null
    })
  }

  return pendingTokenRefresh
}

async function reissueAuthTokens() {
  const refreshToken = getStoredRefreshToken()

  if (!refreshToken) {
    clearStoredAuthTokens()
    return false
  }

  try {
    const tokens = await requestOnce<AuthTokens>("/api/v1/auth/reissue", {
      method: "POST",
      auth: false,
      retryOnUnauthorized: false,
      body: { refreshToken },
    })

    setStoredAuthTokens(tokens)
    return true
  } catch {
    clearStoredAuthTokens()
    return false
  }
}

function notifyAuthExpired() {
  clearStoredAuthTokens()

  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
}

async function readCommonResponse<T>(
  response: Response
): Promise<CommonResponse<T>> {
  const payload = await readJson(response)

  if (!isCommonResponse<T>(payload)) {
    throw new ApiError({
      kind: "PROTOCOL_ERROR",
      message: "API 응답 형식이 올바르지 않습니다.",
      httpStatus: response.status,
      data: payload,
    })
  }

  return payload
}

async function readJson(response: Response) {
  if (response.status === 204) {
    return null
  }

  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function isCommonResponse<T>(value: unknown): value is CommonResponse<T> {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<CommonResponse<T>>

  return (
    typeof candidate.status === "number" &&
    typeof candidate.message === "string" &&
    "data" in candidate &&
    ("errors" in candidate
      ? candidate.errors === null || Array.isArray(candidate.errors)
      : true)
  )
}

function resolveErrorKind(
  httpStatus: number,
  bodyStatus: number,
  errors: ValidationError[] | null
): ApiErrorKind {
  if (httpStatus === 401 || bodyStatus === 401) {
    return "UNAUTHORIZED"
  }

  if (httpStatus === 403 || bodyStatus === 403) {
    return "FORBIDDEN"
  }

  if (errors?.length) {
    return "VALIDATION_ERROR"
  }

  return "HTTP_ERROR"
}

function buildUrl(path: string, query?: QueryParams) {
  const url = new URL(path, API_BASE_URL)

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === null || value === undefined || value === "") {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item))
      }

      continue
    }

    url.searchParams.set(key, String(value))
  }

  return url
}

function serializeBody(body: unknown, headers: Headers) {
  if (body === undefined) {
    return undefined
  }

  if (isBodyInit(body)) {
    return body
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return JSON.stringify(body)
}

function isBodyInit(body: unknown): body is BodyInit {
  return (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams ||
    body instanceof FormData ||
    ArrayBuffer.isView(body)
  )
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "")
}
