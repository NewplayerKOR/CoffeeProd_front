"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { CART_CHANGED_EVENT, getCart } from "@/lib/api/cart"
import { getStoredAuthTokens } from "@/lib/api/auth-token-storage"
import { cn } from "@/lib/utils"

type CartChangedEventDetail = {
  totalQuantity?: number
}

type CartNavButtonProps = {
  className?: string
}

export function CartNavButton({ className }: CartNavButtonProps) {
  const [totalQuantity, setTotalQuantity] = useState(0)

  useEffect(() => {
    let isActive = true

    async function syncCart() {
      if (!getStoredAuthTokens()) {
        if (isActive) {
          setTotalQuantity(0)
        }
        return
      }

      try {
        const cart = await getCart()

        if (isActive) {
          setTotalQuantity(cart.totalQuantity)
        }
      } catch {
        if (isActive) {
          setTotalQuantity(0)
        }
      }
    }

    function handleCartChanged(event: Event) {
      const detail = (event as CustomEvent<CartChangedEventDetail>).detail

      if (typeof detail?.totalQuantity === "number") {
        setTotalQuantity(detail.totalQuantity)
      }

      void syncCart()
    }

    void syncCart()
    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged)

    return () => {
      isActive = false
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged)
    }
  }, [])

  return (
    <Button variant="outline" className={cn("relative", className)} asChild>
      <Link href="/cart">
        <ShoppingCart data-icon="inline-start" />
        장바구니
        {totalQuantity > 0 && (
          <span
            className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold leading-none text-white"
            aria-label={`장바구니 상품 ${totalQuantity}개`}
          >
            {totalQuantity > 9 ? "9+" : totalQuantity}
          </span>
        )}
      </Link>
    </Button>
  )
}
