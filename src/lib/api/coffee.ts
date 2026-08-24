import type { RoastLevel } from "./catalog"
import {
  apiRequest,
  type ApiCacheOptions,
  type QueryParams,
} from "./client"
import type { PageResponse } from "./types"

export type BeanType = "SINGLE_ORIGIN" | "BLEND"

export type CoffeeReference = {
  id: number
  code: string
  name: string
  description: string | null
}

export type CoffeeProfileFlavorNote = {
  flavorNoteId: number
  code: string
  name: string
  description: string | null
  intensity: number
}

export type CoffeeProfileBrewMethod = {
  brewMethodId: number
  code: string
  name: string
  description: string | null
  recommendationNote: string | null
}

export type CoffeeProfileVariety = {
  coffeeVarietyId: number
  code: string
  name: string
  description: string | null
}

export type CoffeeProfileComponent = {
  originCountryCode: string
  originRegion: string | null
  processingMethod: CoffeeReference | null
  componentRatio: number | null
}

export type CoffeeProfile = {
  id: number
  profileName: string
  beanType: BeanType
  processingMethod: CoffeeReference | null
  originCountryCode: string | null
  originRegion: string | null
  farmOrCooperative: string | null
  producer: string | null
  altitudeMin: number | null
  altitudeMax: number | null
  roastLevel: RoastLevel
  decaf: boolean
  decafMethod: string | null
  acidity: number
  body: number
  sweetness: number
  aroma: number
  summary: string | null
  flavorNotes: CoffeeProfileFlavorNote[]
  brewMethods: CoffeeProfileBrewMethod[]
  varieties: CoffeeProfileVariety[]
  components: CoffeeProfileComponent[]
  createdAt: string
  updatedAt: string
}

export type CoffeeProfileSummary = Pick<
  CoffeeProfile,
  | "id"
  | "profileName"
  | "beanType"
  | "originCountryCode"
  | "originRegion"
  | "roastLevel"
  | "decaf"
  | "acidity"
  | "body"
  | "sweetness"
  | "aroma"
  | "summary"
  | "flavorNotes"
  | "brewMethods"
  | "varieties"
  | "components"
> & {
  processingMethodName: string | null
}

export type CoffeeProfileRequest = {
  processingMethodId: number | null
  profileName: string
  beanType: BeanType
  originCountryCode: string | null
  originRegion: string | null
  farmOrCooperative: string | null
  producer: string | null
  altitudeMin: number | null
  altitudeMax: number | null
  roastLevel: RoastLevel
  decaf: boolean
  decafMethod: string | null
  acidity: number
  body: number
  sweetness: number
  aroma: number
  summary: string | null
  flavorNotes: Array<{
    flavorNoteId: number
    intensity: number
  }>
  brewMethods: Array<{
    brewMethodId: number
    recommendationNote: string | null
  }>
  varieties: Array<{
    coffeeVarietyId: number
  }>
  components: Array<{
    originCountryCode: string
    originRegion: string | null
    processingMethodId: number | null
    componentRatio: number | null
  }>
}

export type CoffeeRecommendationRequest = {
  roastLevel?: RoastLevel
  beanType?: BeanType
  processingMethodId?: number
  decaf?: boolean
  preferredAcidity?: number
  preferredBody?: number
  preferredSweetness?: number
  preferredAroma?: number
  limit?: number
}

export type CoffeeRecommendation = {
  productId: number
  categoryName: string
  sku: string
  name: string
  price: number
  weightGrams: number
  imageUrl: string | null
  coffeeProfileId: number
  coffeeProfileName: string
  processingMethodName: string | null
  roastLevel: RoastLevel
  beanType: BeanType
  decaf: boolean
  acidity: number
  body: number
  sweetness: number
  aroma: number
  flavorNotes: CoffeeProfileFlavorNote[]
  brewMethods: CoffeeProfileBrewMethod[]
  varieties: CoffeeProfileVariety[]
  components: CoffeeProfileComponent[]
  recommendationScore: number
  reasons: string[]
}

export type MemberCoffeePreferenceRequest = Omit<
  CoffeeRecommendationRequest,
  "limit"
>

export type MemberCoffeePreference = {
  id: number
  processingMethod: CoffeeReference | null
  beanType: BeanType | null
  roastLevel: RoastLevel | null
  decaf: boolean | null
  preferredAcidity: number | null
  preferredBody: number | null
  preferredSweetness: number | null
  preferredAroma: number | null
}

export type CoffeeProfileListParams = {
  page?: number
  size?: number
  sort?: string
}

export type CoffeeReferenceKind =
  | "processing-methods"
  | "flavor-notes"
  | "brew-methods"
  | "coffee-varieties"

export type CoffeeReferenceCreateRequest = {
  code: string
  name: string
  description: string | null
}

export type CoffeeReferenceUpdateRequest = Omit<
  CoffeeReferenceCreateRequest,
  "code"
>

export function getCoffeeProfiles(
  params: CoffeeProfileListParams = {},
  cacheOptions: ApiCacheOptions = {}
) {
  return apiRequest<PageResponse<CoffeeProfile>>("/api/v1/coffee-profiles", {
    auth: false,
    query: params as QueryParams,
    ...cacheOptions,
  })
}

export function getCoffeeProfile(
  coffeeProfileId: number | string,
  cacheOptions: ApiCacheOptions = {}
) {
  return apiRequest<CoffeeProfile>(
    `/api/v1/coffee-profiles/${encodeURIComponent(coffeeProfileId)}`,
    { auth: false, ...cacheOptions }
  )
}

export function getProcessingMethods(cacheOptions: ApiCacheOptions = {}) {
  return getPublicCoffeeReferences("processing-methods", cacheOptions)
}

export function getFlavorNotes(cacheOptions: ApiCacheOptions = {}) {
  return getPublicCoffeeReferences("flavor-notes", cacheOptions)
}

export function getBrewMethods(cacheOptions: ApiCacheOptions = {}) {
  return getPublicCoffeeReferences("brew-methods", cacheOptions)
}

export function getCoffeeVarieties(cacheOptions: ApiCacheOptions = {}) {
  return getPublicCoffeeReferences("coffee-varieties", cacheOptions)
}

export function recommendCoffee(payload: CoffeeRecommendationRequest) {
  return apiRequest<CoffeeRecommendation[]>("/api/v1/coffee-recommendations", {
    method: "POST",
    auth: false,
    body: payload,
  })
}

export function getMyCoffeePreference() {
  return apiRequest<MemberCoffeePreference>(
    "/api/v1/members/me/coffee-preference"
  )
}

export function saveMyCoffeePreference(
  payload: MemberCoffeePreferenceRequest
) {
  return apiRequest<MemberCoffeePreference>(
    "/api/v1/members/me/coffee-preference",
    {
      method: "PUT",
      body: payload,
    }
  )
}

export function getMyCoffeeRecommendations(limit = 5) {
  return apiRequest<CoffeeRecommendation[]>(
    "/api/v1/coffee-recommendations/me",
    { query: { limit } }
  )
}

export function getAdminCoffeeProfiles(params: CoffeeProfileListParams = {}) {
  return apiRequest<PageResponse<CoffeeProfile>>(
    "/api/v1/admin/coffee-profiles",
    { query: params as QueryParams }
  )
}

export function getAdminCoffeeProfile(coffeeProfileId: number | string) {
  return apiRequest<CoffeeProfile>(
    `/api/v1/admin/coffee-profiles/${encodeURIComponent(coffeeProfileId)}`
  )
}

export function createAdminCoffeeProfile(payload: CoffeeProfileRequest) {
  return apiRequest<CoffeeProfile>("/api/v1/admin/coffee-profiles", {
    method: "POST",
    body: payload,
  })
}

export function updateAdminCoffeeProfile(
  coffeeProfileId: number | string,
  payload: CoffeeProfileRequest
) {
  return apiRequest<CoffeeProfile>(
    `/api/v1/admin/coffee-profiles/${encodeURIComponent(coffeeProfileId)}`,
    {
      method: "PUT",
      body: payload,
    }
  )
}

export function getAdminCoffeeReferences(kind: CoffeeReferenceKind) {
  return apiRequest<CoffeeReference[]>(`/api/v1/admin/${kind}`)
}

export function createAdminCoffeeReference(
  kind: CoffeeReferenceKind,
  payload: CoffeeReferenceCreateRequest
) {
  return apiRequest<CoffeeReference>(`/api/v1/admin/${kind}`, {
    method: "POST",
    body: payload,
  })
}

export function updateAdminCoffeeReference(
  kind: CoffeeReferenceKind,
  referenceId: number | string,
  payload: CoffeeReferenceUpdateRequest
) {
  return apiRequest<CoffeeReference>(
    `/api/v1/admin/${kind}/${encodeURIComponent(referenceId)}`,
    {
      method: "PUT",
      body: payload,
    }
  )
}

function getPublicCoffeeReferences(
  kind: CoffeeReferenceKind,
  cacheOptions: ApiCacheOptions
) {
  return apiRequest<CoffeeReference[]>(`/api/v1/${kind}`, {
    auth: false,
    ...cacheOptions,
  })
}
