import type { Member } from "./auth"
import { apiRequest } from "./client"

export type UpdateMemberProfileRequest = {
  nickname: string
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

export type WithdrawMemberRequest = {
  currentPassword: string
}

export function updateMemberProfile(payload: UpdateMemberProfileRequest) {
  return apiRequest<Member>("/api/v1/members/me", {
    method: "PATCH",
    body: payload,
  })
}

export function changeMemberPassword(payload: ChangePasswordRequest) {
  return apiRequest<null>("/api/v1/members/me/password", {
    method: "PATCH",
    body: payload,
  })
}

export function withdrawMember(payload: WithdrawMemberRequest) {
  return apiRequest<null>("/api/v1/members/me", {
    method: "DELETE",
    body: payload,
  })
}
