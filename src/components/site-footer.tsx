import Link from "next/link"
import { Mail } from "lucide-react"

const footerLinks = [
  { href: "/about", label: "소개" },
  { href: "/products", label: "상품" },
  { href: "/recommendations", label: "취향 추천" },
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <Link href="/" className="site-wordmark">
            CoffeeProd
          </Link>
          <p className="site-footer-copy">
            취향을 기록하고, 오래 기억할 한 잔을 발견하는 스페셜티 커피
            커머스입니다.
          </p>
        </div>

        <nav aria-label="하단 메뉴">
          {footerLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-footer-contact">
          <p className="site-footer-label">고객센터</p>
          <p>
            <Mail />
            support@coffeeprod.example
          </p>
          <p>평일 10:00 - 17:00</p>
        </div>
      </div>
      <div className="site-footer-legal">
        <p>본 사이트는 실제 판매 페이지가 아닌 포트폴리오 사이트입니다.</p>
        <p>© 2026 CoffeeProd. All rights reserved.</p>
      </div>
    </footer>
  )
}
