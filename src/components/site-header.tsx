import Link from "next/link"
import { Menu } from "lucide-react"

import { CartNavButton } from "@/app/cart/cart-nav-button"
import { HomeAuthActions } from "@/app/home-auth-actions"
import { ThemeToggle } from "@/components/theme-toggle"

const navigation = [
  { href: "/about", label: "소개" },
  { href: "/products", label: "상품" },
  { href: "/recommendations", label: "취향 추천" },
  { href: "/coffee-profiles", label: "커피 프로필" },
  { href: "/orders", label: "주문" },
]

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-wordmark" aria-label="CoffeeProd 메인">
          CoffeeProd
        </Link>

        <nav className="site-desktop-nav" aria-label="주요 메뉴">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-desktop-actions">
          <CartNavButton iconOnly />
          <ThemeToggle />
          <HomeAuthActions compact />
        </div>

        <div className="site-mobile-actions">
          <CartNavButton iconOnly />
          <ThemeToggle />
          <details className="site-mobile-menu">
            <summary aria-label="메뉴 열기">
              <Menu />
            </summary>
            <div className="site-mobile-menu-panel">
              <nav aria-label="모바일 주요 메뉴">
                {navigation.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="site-mobile-account">
                <HomeAuthActions />
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}
