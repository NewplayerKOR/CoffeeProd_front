"use client"

import { usePathname } from "next/navigation"
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { getMe, type Member } from "@/lib/api/auth"
import {
  AUTH_TOKENS_CHANGED_EVENT,
  clearStoredAuthTokens,
  getStoredAuthTokens,
} from "@/lib/api/auth-token-storage"
import { CART_CHANGED_EVENT, getCart, type Cart } from "@/lib/api/cart"
import { AUTH_EXPIRED_EVENT } from "@/lib/api/client"

type SessionStatus = "checking" | "guest" | "authenticated"
type CartStatus = "idle" | "checking" | "ready" | "error"

type SessionState = {
  status: SessionStatus
  member: Member | null
  cart: Cart
  cartStatus: CartStatus
  cartError: string | null
  refreshSession: () => Promise<void>
  replaceCart: (cart: Cart) => void
}

type CartChangedEventDetail = {
  cart?: Cart
  totalQuantity?: number
}

const emptyCart: Cart = {
  items: [],
  totalPrice: 0,
  totalQuantity: 0,
}

const SessionStateContext = createContext<SessionState | null>(null)

export function SessionStateProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const shouldSyncSession = needsSharedSession(pathname)
  const [status, setStatus] = useState<SessionStatus>("checking")
  const [member, setMember] = useState<Member | null>(null)
  const [cart, setCart] = useState<Cart>(emptyCart)
  const [cartStatus, setCartStatus] = useState<CartStatus>("idle")
  const [cartError, setCartError] = useState<string | null>(null)

  const resetSession = useCallback(() => {
    setStatus("guest")
    setMember(null)
    setCart(emptyCart)
    setCartStatus("idle")
    setCartError(null)
  }, [])

  const refreshSession = useCallback(async () => {
    if (!getStoredAuthTokens()) {
      resetSession()
      return
    }

    setStatus("checking")
    setCartStatus("checking")
    setCartError(null)

    const [memberResult, cartResult] = await Promise.allSettled([
      getMe(),
      getCart(),
    ])

    if (memberResult.status === "rejected") {
      clearStoredAuthTokens()
      resetSession()
      return
    }

    setMember(memberResult.value)
    setStatus("authenticated")

    if (cartResult.status === "fulfilled") {
      setCart(cartResult.value)
      setCartStatus("ready")
      return
    }

    setCart(emptyCart)
    setCartStatus("error")
    setCartError("장바구니를 불러오지 못했습니다.")
  }, [resetSession])

  const replaceCart = useCallback((nextCart: Cart) => {
    setCart(nextCart)
    setCartStatus("ready")
    setCartError(null)
  }, [])

  useEffect(() => {
    function handleAuthExpired() {
      resetSession()
    }

    function handleAuthTokensChanged() {
      if (shouldSyncSession) {
        void refreshSession()
      }
    }

    function handleCartChanged(event: Event) {
      const detail = (event as CustomEvent<CartChangedEventDetail>).detail

      if (detail?.cart) {
        replaceCart(detail.cart)
        return
      }

      if (typeof detail?.totalQuantity !== "number") {
        return
      }

      setCart((current) => ({
        ...current,
        totalQuantity: detail.totalQuantity ?? current.totalQuantity,
      }))
      setCartStatus("ready")
    }

    const initialSyncId = window.setTimeout(() => {
      if (shouldSyncSession) {
        void refreshSession()
      }
    }, 0)
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, handleAuthTokensChanged)
    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged)

    return () => {
      window.clearTimeout(initialSyncId)
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
      window.removeEventListener(
        AUTH_TOKENS_CHANGED_EVENT,
        handleAuthTokensChanged
      )
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged)
    }
  }, [refreshSession, replaceCart, resetSession, shouldSyncSession])

  const value = useMemo<SessionState>(
    () => ({
      status,
      member,
      cart,
      cartStatus,
      cartError,
      refreshSession,
      replaceCart,
    }),
    [
      status,
      member,
      cart,
      cartStatus,
      cartError,
      refreshSession,
      replaceCart,
    ]
  )

  return (
    <SessionStateContext.Provider value={value}>
      {children}
    </SessionStateContext.Provider>
  )
}

export function useSessionState() {
  const value = useContext(SessionStateContext)

  if (!value) {
    throw new Error("useSessionState must be used within SessionStateProvider")
  }

  return value
}

function needsSharedSession(pathname: string) {
  return ![
    "/admin",
    "/checkout",
    "/login",
    "/orders",
    "/password-changed",
    "/signup",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
