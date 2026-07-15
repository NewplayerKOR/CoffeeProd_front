import type { CoffeePreferenceFormState } from "@/components/coffee-preference-fields"
import type {
  MemberCoffeePreferenceRequest,
  MemberCoffeePreference,
} from "@/lib/api/coffee"

export function toCoffeePreferencePayload(
  form: CoffeePreferenceFormState
): MemberCoffeePreferenceRequest {
  return {
    ...(form.roastLevel ? { roastLevel: form.roastLevel } : {}),
    ...(form.beanType ? { beanType: form.beanType } : {}),
    ...(form.processingMethodId
      ? { processingMethodId: Number(form.processingMethodId) }
      : {}),
    ...(form.decaf ? { decaf: form.decaf === "true" } : {}),
    ...(form.preferredAcidity
      ? { preferredAcidity: Number(form.preferredAcidity) }
      : {}),
    ...(form.preferredBody
      ? { preferredBody: Number(form.preferredBody) }
      : {}),
    ...(form.preferredSweetness
      ? { preferredSweetness: Number(form.preferredSweetness) }
      : {}),
    ...(form.preferredAroma
      ? { preferredAroma: Number(form.preferredAroma) }
      : {}),
  }
}

export function hasCoffeePreference(payload: MemberCoffeePreferenceRequest) {
  return Object.keys(payload).length > 0
}

export function coffeePreferenceToForm(
  preference: MemberCoffeePreference
): CoffeePreferenceFormState {
  return {
    roastLevel: preference.roastLevel ?? "",
    beanType: preference.beanType ?? "",
    processingMethodId: preference.processingMethod
      ? String(preference.processingMethod.id)
      : "",
    decaf:
      preference.decaf === null ? "" : preference.decaf ? "true" : "false",
    preferredAcidity: preference.preferredAcidity
      ? String(preference.preferredAcidity)
      : "",
    preferredBody: preference.preferredBody
      ? String(preference.preferredBody)
      : "",
    preferredSweetness: preference.preferredSweetness
      ? String(preference.preferredSweetness)
      : "",
    preferredAroma: preference.preferredAroma
      ? String(preference.preferredAroma)
      : "",
  }
}
