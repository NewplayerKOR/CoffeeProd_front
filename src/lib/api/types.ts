export type ValidationError = {
  field: string
  message: string
}

export type CommonResponse<T> = {
  status: number
  message: string
  data: T
  errors: ValidationError[] | null
}

export type PageResponse<T> = {
  content: T[]
  totalPages: number
  totalElements: number
  last: boolean
  size: number
  number: number
  numberOfElements: number
  first: boolean
  empty: boolean
}

export type ApiErrorKind =
  | "NETWORK_ERROR"
  | "PROTOCOL_ERROR"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "HTTP_ERROR"

type ApiErrorOptions = {
  kind: ApiErrorKind
  message: string
  httpStatus: number
  bodyStatus?: number
  errors?: ValidationError[] | null
  data?: unknown
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly httpStatus: number
  readonly bodyStatus?: number
  readonly errors: ValidationError[] | null
  readonly data?: unknown

  constructor({
    kind,
    message,
    httpStatus,
    bodyStatus,
    errors = null,
    data,
  }: ApiErrorOptions) {
    super(message)
    this.name = "ApiError"
    this.kind = kind
    this.httpStatus = httpStatus
    this.bodyStatus = bodyStatus
    this.errors = errors
    this.data = data
  }

  get isValidationError() {
    return this.kind === "VALIDATION_ERROR" && Boolean(this.errors?.length)
  }
}

export function validationErrorsToFieldMap(
  errors: ValidationError[] | null | undefined
) {
  return (errors ?? []).reduce<Record<string, string>>((fieldMap, error) => {
    fieldMap[error.field] = error.message
    return fieldMap
  }, {})
}
