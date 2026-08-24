"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"

import { useSessionState } from "@/components/session-state-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CartNavButtonProps = {
  className?: string
  iconOnly?: boolean
}

export function CartNavButton({ className, iconOnly = false }: CartNavButtonProps) {
  const { cart } = useSessionState()
  const totalQuantity = cart.totalQuantity

  return (
    <Button
      variant={iconOnly ? "ghost" : "outline"}
      size={iconOnly ? "icon" : "default"}
      className={cn("relative", className)}
      asChild
    >
      <Link href="/cart">
        <ShoppingCart data-icon="inline-start" />
        {iconOnly ? <span className="sr-only">장바구니</span> : "장바구니"}
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
