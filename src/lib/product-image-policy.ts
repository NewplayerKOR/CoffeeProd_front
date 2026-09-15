export const PRODUCT_IMAGE_HOST = "assets-coffeeprod.ttagyulab.com"
export const PRODUCT_IMAGE_PATH_PREFIX = "/products/catalog/"
export const PRODUCT_IMAGE_BASE_URL = `https://${PRODUCT_IMAGE_HOST}${PRODUCT_IMAGE_PATH_PREFIX}`
export const PRODUCT_IMAGE_FALLBACK_SRC = "/images/product-fallback.webp"

const catalogImagePathPattern =
  /^\/products\/catalog\/[a-z0-9]+(?:-[a-z0-9]+)*-v[1-9][0-9]*\.webp$/

export function normalizeProductImageUrl(value: string | null | undefined) {
  const normalized = value?.trim() ?? ""

  return normalized || null
}

export function isApprovedProductImageUrl(value: string) {
  try {
    const url = new URL(value)

    return (
      url.protocol === "https:" &&
      url.hostname === PRODUCT_IMAGE_HOST &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      url.search === "" &&
      url.hash === "" &&
      catalogImagePathPattern.test(url.pathname)
    )
  } catch {
    return false
  }
}

export function resolveProductImageSource(value: string | null | undefined) {
  const normalized = normalizeProductImageUrl(value)

  return normalized && isApprovedProductImageUrl(normalized)
    ? normalized
    : PRODUCT_IMAGE_FALLBACK_SRC
}

export function resolveProductImageRenderSource(
  value: string | null | undefined,
  failedSource: string | null
) {
  const resolvedSource = resolveProductImageSource(value)

  return failedSource === resolvedSource
    ? PRODUCT_IMAGE_FALLBACK_SRC
    : resolvedSource
}

export function getProductImageUrlError(value: string | null | undefined) {
  const normalized = normalizeProductImageUrl(value)

  if (!normalized) {
    return null
  }

  if (normalized.length > 500) {
    return "이미지 URL은 500자 이내로 입력해 주세요."
  }

  if (!isApprovedProductImageUrl(normalized)) {
    return `이미지 URL은 ${PRODUCT_IMAGE_BASE_URL} 경로의 버전이 포함된 WebP 파일만 사용할 수 있습니다.`
  }

  return null
}
