export const DELIVERY_BASE_FEE = 3000
export const DELIVERY_FREE_THRESHOLD = 30000

export function calculateEstimatedDeliveryFee(productTotalPrice: number) {
  if (
    productTotalPrice <= 0 ||
    productTotalPrice >= DELIVERY_FREE_THRESHOLD
  ) {
    return 0
  }

  return DELIVERY_BASE_FEE
}
