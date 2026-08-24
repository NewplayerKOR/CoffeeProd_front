import { getProcessingMethods, type CoffeeReference } from "@/lib/api/coffee"
import { ApiError } from "@/lib/api/types"

import { CoffeePreferenceView } from "./coffee-preference-view"

export default async function CoffeePreferencePage() {
  const references = await loadProcessingMethods()

  return (
    <CoffeePreferenceView
      initialProcessingMethods={references.data}
      initialReferenceError={references.error}
    />
  )
}

async function loadProcessingMethods(): Promise<{
  data: CoffeeReference[]
  error: string | null
}> {
  try {
    return {
      data: await getProcessingMethods({
        next: { revalidate: 300, tags: ["coffee-references"] },
      }),
      error: null,
    }
  } catch (error) {
    return {
      data: [],
      error:
        error instanceof ApiError
          ? error.message
          : "커피 기준 정보를 불러오지 못했습니다.",
    }
  }
}
