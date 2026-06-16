import type { GrindType } from "./api/cart"
import type { OrderStatus } from "./api/order"

export function canCancelOrder(status: OrderStatus) {
  return status === "PENDING" || status === "PAID"
}

export function getOrderStatusLabel(status: OrderStatus) {
  if (status === "PENDING") {
    return "결제 대기"
  }

  if (status === "PAID") {
    return "결제 완료"
  }

  if (status === "SHIPPED") {
    return "배송 중"
  }

  if (status === "DELIVERED") {
    return "배송 완료"
  }

  return "취소"
}

export function getGrindTypeLabel(grindType: GrindType) {
  if (grindType === "WHOLE_BEAN") {
    return "홀빈"
  }

  if (grindType === "ESPRESSO") {
    return "에스프레소"
  }

  if (grindType === "DRIP") {
    return "드립"
  }

  return "프렌치프레스"
}
