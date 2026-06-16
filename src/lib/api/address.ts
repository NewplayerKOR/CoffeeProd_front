import { apiRequest } from "./client"

export type Address = {
  id: number
  recipient: string
  phone: string
  zipcode: string
  addressLine1: string
  addressLine2: string
  isDefault: boolean
}

type AddressApiResponse = Omit<Address, "isDefault"> & {
  isDefault?: boolean
  default?: boolean
  defaultAddress?: boolean
  is_default?: boolean
}

export type AddressRequest = {
  recipient: string
  phone: string
  zipcode: string
  addressLine1: string
  addressLine2: string
}

export function getAddresses() {
  return apiRequest<AddressApiResponse[]>("/api/v1/members/me/addresses").then(
    (addresses) => addresses.map(normalizeAddress)
  )
}

export function getAddress(addressId: number | string) {
  return apiRequest<AddressApiResponse>(
    `/api/v1/members/me/addresses/${encodeURIComponent(addressId)}`
  ).then(normalizeAddress)
}

export function createAddress(payload: AddressRequest) {
  return apiRequest<AddressApiResponse>("/api/v1/members/me/addresses", {
    method: "POST",
    body: payload,
  }).then(normalizeAddress)
}

export function updateAddress(addressId: number, payload: AddressRequest) {
  return apiRequest<AddressApiResponse>(`/api/v1/members/me/addresses/${addressId}`, {
    method: "PUT",
    body: payload,
  }).then(normalizeAddress)
}

export function deleteAddress(addressId: number) {
  return apiRequest<null>(`/api/v1/members/me/addresses/${addressId}`, {
    method: "DELETE",
  })
}

export function setDefaultAddress(addressId: number) {
  return apiRequest<AddressApiResponse>(
    `/api/v1/members/me/addresses/${addressId}/default`,
    {
      method: "PATCH",
    }
  ).then(normalizeAddress)
}

function normalizeAddress(address: AddressApiResponse): Address {
  return {
    id: address.id,
    recipient: address.recipient,
    phone: address.phone,
    zipcode: address.zipcode,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    isDefault:
      address.isDefault ??
      address.default ??
      address.defaultAddress ??
      address.is_default ??
      false,
  }
}
