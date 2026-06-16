import { apiRequest } from "./client"
import type { AuthTokens } from "./auth-token-storage"

export type MemberGrade = "BRONZE" | "SILVER" | "GOLD"
export type MemberStatus = "ACTIVE" | "SUSPENDED" | "WITHDRAWN"
export type MemberRole = "USER" | "ADMIN"

export type Member = {
  id: number
  email: string
  name: string
  nickname: string
  grade: MemberGrade
  mileage: number
  status: MemberStatus
  role?: MemberRole
}

export type SignupRequest = {
  email: string
  password: string
  name: string
  nickname: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type CheckEmailResponse = {
  available: boolean
}

export function signup(payload: SignupRequest) {
  return apiRequest<Member>("/api/v1/auth/signup", {
    method: "POST",
    auth: false,
    body: payload,
  })
}

export function checkEmailAvailable(email: string) {
  return apiRequest<CheckEmailResponse>("/api/v1/auth/check-email", {
    auth: false,
    query: { email },
  })
}

export function login(payload: LoginRequest) {
  return apiRequest<AuthTokens>("/api/v1/auth/login", {
    method: "POST",
    auth: false,
    body: payload,
  })
}

export function logout() {
  return apiRequest<null>("/api/v1/auth/logout", {
    method: "POST",
  })
}

export function getMe() {
  return apiRequest<Member>("/api/v1/members/me")
}
