import type { RoastLevel } from "@/lib/api/catalog"
import type { BeanType } from "@/lib/api/coffee"

export function getBeanTypeLabel(beanType: BeanType) {
  return beanType === "SINGLE_ORIGIN" ? "싱글 오리진" : "블렌드"
}

export function getRoastLevelLabel(roastLevel: RoastLevel) {
  if (roastLevel === "LIGHT") {
    return "라이트"
  }

  if (roastLevel === "DARK") {
    return "다크"
  }

  return "미디엄"
}
