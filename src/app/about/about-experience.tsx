"use client"

import Link from "next/link"
import {
  ArrowRight,
  Coffee,
  CreditCard,
  MapPin,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  Truck,
} from "lucide-react"
import { type ReactNode, useEffect, useRef, useState } from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

const values = [
  {
    title: "원두를 고르는 순간",
    description:
      "카테고리, 로스팅 강도, 상품 상세를 따라가며 원하는 원두를 빠르게 탐색합니다.",
    icon: Coffee,
  },
  {
    title: "장바구니에서 주문까지",
    description:
      "분쇄 옵션과 수량을 정리하고 기본 배송지, 마일리지, 주문서를 하나의 흐름으로 연결합니다.",
    icon: ShoppingCart,
  },
  {
    title: "결제와 배송 관리",
    description:
      "Toss 결제위젯, 결제 대기 주문 재개, 배송지와 주문 내역까지 실무형 상태를 확인합니다.",
    icon: CreditCard,
  },
]

const flowSteps = [
  { label: "상품 탐색", icon: Coffee },
  { label: "장바구니", icon: ShoppingCart },
  { label: "배송지", icon: MapPin },
  { label: "결제", icon: CreditCard },
  { label: "배송", icon: Truck },
]

const sections = [
  { id: "intro", label: "Intro" },
  { id: "state", label: "State" },
  { id: "flow", label: "Flow" },
  { id: "detail", label: "Detail" },
  { id: "end", label: "CoffeeProd" },
]

const desktopMediaQuery = "(min-width: 768px)"
const sectionIds = sections.map((section) => section.id)

export function AboutExperience() {
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const heroRef = useRef<HTMLElement | null>(null)
  const activeSectionRef = useRef("intro")
  const isWheelLockedRef = useRef(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 })
  const [activeSection, setActiveSection] = useState("intro")

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) {
      return
    }

    const animatedElements = Array.from(
      scrollContainer.querySelectorAll<HTMLElement>("[data-reveal]")
    )
    const sectionElements = Array.from(
      scrollContainer.querySelectorAll<HTMLElement>("[data-section-id]")
    )

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true")
          } else {
            entry.target.setAttribute("data-visible", "false")
          }
        }
      },
      {
        root: scrollContainer,
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.18,
      }
    )
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visibleEntry instanceof IntersectionObserverEntry) {
          const sectionId = visibleEntry.target.getAttribute("data-section-id")

          if (sectionId) {
            activeSectionRef.current = sectionId
            setActiveSection(sectionId)
          }
        }
      },
      {
        root: scrollContainer,
        threshold: [0.45, 0.6, 0.75],
      }
    )

    for (const element of animatedElements) {
      revealObserver.observe(element)
    }

    for (const element of sectionElements) {
      sectionObserver.observe(element)
    }

    return () => {
      revealObserver.disconnect()
      sectionObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) {
      return
    }

    function updateScrollProgress() {
      if (!scrollContainer) {
        return
      }

      const progress = Math.min(
        Math.max(scrollContainer.scrollTop / Math.max(scrollContainer.clientHeight, 1), 0),
        1
      )

      setScrollProgress(progress)
    }

    scrollContainer.addEventListener("scroll", updateScrollProgress, {
      passive: true,
    })
    window.addEventListener("resize", updateScrollProgress)

    return () => {
      scrollContainer.removeEventListener("scroll", updateScrollProgress)
      window.removeEventListener("resize", updateScrollProgress)
    }
  }, [])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) {
      return
    }

    const desktopQuery = window.matchMedia(desktopMediaQuery)

    function handleWheel(event: WheelEvent) {
      if (!desktopQuery.matches || Math.abs(event.deltaY) < 18) {
        return
      }

      event.preventDefault()

      if (isWheelLockedRef.current) {
        return
      }

      const currentIndex = Math.max(
        sectionIds.indexOf(activeSectionRef.current),
        0
      )
      const nextIndex =
        event.deltaY > 0
          ? Math.min(currentIndex + 1, sectionIds.length - 1)
          : Math.max(currentIndex - 1, 0)

      if (nextIndex === currentIndex) {
        return
      }

      const nextSectionId = sectionIds[nextIndex]
      const nextSection = scrollContainer.querySelector<HTMLElement>(
        `[data-section-id="${nextSectionId}"]`
      )

      if (!nextSection) {
        return
      }

      isWheelLockedRef.current = true
      activeSectionRef.current = nextSectionId
      setActiveSection(nextSectionId)
      nextSection.scrollIntoView({ behavior: "smooth", block: "start" })

      window.setTimeout(() => {
        isWheelLockedRef.current = false
      }, 920)
    }

    scrollContainer.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      scrollContainer.removeEventListener("wheel", handleWheel)
    }
  }, [])

  return (
    <main
      ref={scrollContainerRef}
      className="h-dvh snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth bg-neutral-950 text-white"
    >
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-neutral-950/72 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Coffee className="size-5" />
            CoffeeProd
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link href="/">메인</Link>
            </Button>
            <ThemeToggle />
            <Button size="sm" asChild>
              <Link href="/products">
                상품
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <nav
        className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 md:flex"
        aria-label="소개 페이지 섹션"
      >
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className="group flex items-center justify-end gap-2"
            onClick={() => {
              activeSectionRef.current = section.id
              setActiveSection(section.id)
              scrollContainerRef.current
                ?.querySelector(`[data-section-id="${section.id}"]`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
            aria-label={`${section.label} 섹션으로 이동`}
          >
            <span className="text-xs font-medium text-white/0 transition-colors group-hover:text-white/70">
              {section.label}
            </span>
            <span
              className={
                activeSection === section.id
                  ? "h-8 w-1.5 rounded-full bg-amber-200"
                  : "h-3 w-1.5 rounded-full bg-white/30 transition-colors group-hover:bg-white/70"
              }
            />
          </button>
        ))}
      </nav>

      <section
        ref={heroRef}
        data-section-id="intro"
        className="relative flex min-h-dvh snap-start snap-always items-end overflow-hidden px-6 pb-16 pt-28"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          setPointerOffset({
            x: (event.clientX - rect.left) / rect.width - 0.5,
            y: (event.clientY - rect.top) / rect.height - 0.5,
          })
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/hero-coffee-bg.svg')",
            transform: `scale(${1 + scrollProgress * 0.12}) translateY(${
              scrollProgress * 36
            }px)`,
          }}
        />
        <div className="absolute inset-0 bg-neutral-950/58" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-neutral-950 to-transparent" />
        <div
          className="absolute right-[8%] top-[22%] hidden h-52 w-52 rounded-full border border-white/20 bg-white/10 backdrop-blur md:block"
          style={{
            transform: `translate(${pointerOffset.x * 32}px, ${
              pointerOffset.y * 32
            }px) rotate(${scrollProgress * 22}deg)`,
          }}
        />
        <div
          className="absolute right-[19%] top-[40%] hidden h-28 w-28 rounded-lg border border-amber-200/30 bg-amber-200/15 backdrop-blur md:block"
          style={{
            transform: `translate(${pointerOffset.x * -42}px, ${
              pointerOffset.y * -30
            }px) rotate(${-10 - scrollProgress * 18}deg)`,
          }}
        />

        <div className="relative mx-auto w-full max-w-6xl">
          <div
            className="max-w-3xl"
            data-reveal
            style={{
              transform: `translateY(${scrollProgress * -20}px) scale(${
                1 - scrollProgress * 0.035
              })`,
            }}
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
              <Sparkles className="size-4" />
              Coffee commerce experience
            </p>
            <h1 className="mt-5 text-5xl font-bold leading-tight md:text-7xl">
              커피를 고르고, 주문하고, 기다리는 모든 과정을 하나의 흐름으로.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-200">
              CoffeeProd는 단순한 상품 목록을 넘어 장바구니, 배송지, 결제,
              주문 상태를 실제 커머스처럼 이어 보는 프론트엔드 경험입니다.
            </p>
          </div>
        </div>
      </section>

      <section
        data-section-id="state"
        className="min-h-dvh snap-start snap-always overflow-hidden px-6 py-24"
      >
        <div className="mx-auto grid min-h-[calc(100dvh-12rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <RevealBlock>
            <p className="text-sm font-semibold text-amber-200">What we build</p>
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              쇼핑몰의 핵심 상태를 눈에 보이게 연결합니다.
            </h2>
          </RevealBlock>

          <div className="grid gap-4">
            {values.map((value, index) => {
              const Icon = value.icon

              return (
                <RevealBlock key={value.title} delay={index * 120}>
                  <article className="group rounded-lg border border-white/10 bg-white/[0.06] p-5 transition-transform duration-300 hover:-translate-y-2 hover:bg-white/[0.09]">
                    <div className="flex items-start gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-950">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{value.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-neutral-300">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </article>
                </RevealBlock>
              )
            })}
          </div>
        </div>
      </section>

      <section
        data-section-id="flow"
        className="relative min-h-dvh snap-start snap-always overflow-hidden border-y border-white/10 bg-white text-neutral-950"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_82%_64%,rgba(20,184,166,0.16),transparent_30%)]" />
        <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center px-6 py-24">
          <RevealBlock>
            <p className="text-sm font-semibold text-neutral-500">Flow</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              주문이 끊기지 않도록, 다음 행동을 항상 남겨둡니다.
            </h2>
          </RevealBlock>

          <div className="mt-14 grid gap-3 md:grid-cols-5">
            {flowSteps.map((step, index) => {
              const Icon = step.icon

              return (
                <RevealBlock key={step.label} delay={index * 100}>
                  <div className="relative rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-2 hover:rotate-1">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-neutral-950 text-white">
                      <Icon className="size-5" />
                    </div>
                    <p className="mt-5 text-sm font-medium text-neutral-500">
                      Step {index + 1}
                    </p>
                    <h3 className="mt-1 text-xl font-bold">{step.label}</h3>
                  </div>
                </RevealBlock>
              )
            })}
          </div>
        </div>
      </section>

      <section
        data-section-id="detail"
        className="min-h-dvh snap-start snap-always overflow-hidden px-6 py-24"
      >
        <div className="mx-auto grid min-h-[calc(100dvh-12rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <RevealBlock>
            <div className="relative min-h-[460px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.06]">
              <div className="absolute inset-0 bg-[url('/images/hero-coffee-bg.svg')] bg-cover bg-center opacity-70" />
              <div className="absolute inset-0 bg-neutral-950/20" />
              <div className="absolute bottom-6 left-6 right-6 rounded-lg bg-neutral-950/78 p-5 backdrop-blur">
                <p className="text-sm font-medium text-amber-200">Live states</p>
                <h3 className="mt-2 text-2xl font-bold">결제 대기 주문 재개</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-300">
                  주문이 생성된 뒤 결제를 이탈해도 사용자는 주문 내역에서 결제를
                  재개하거나 취소할 수 있습니다.
                </p>
              </div>
            </div>
          </RevealBlock>

          <RevealBlock delay={160}>
            <p className="text-sm font-semibold text-amber-200">Why it matters</p>
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              화면은 예쁘게, 상태는 실무처럼.
            </h2>
            <p className="mt-6 text-base leading-8 text-neutral-300">
              프론트엔드는 단순히 API를 호출하는 데서 끝나지 않습니다. 로그인
              상태, 장바구니 변경, 기본 배송지, 결제 대기 주문처럼 사용자가
              실제로 마주치는 상태를 자연스럽게 이어줘야 합니다.
            </p>
            <Button className="mt-8" asChild>
              <Link href="/products">
                상품 둘러보기
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </RevealBlock>
        </div>
      </section>

      <section
        data-section-id="end"
        className="flex min-h-dvh snap-start snap-always items-center justify-center border-t border-white/10 px-6 py-20"
      >
        <RevealBlock>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <PackageCheck className="size-10 text-amber-200" />
            <h2 className="mt-5 text-4xl font-bold">CoffeeProd</h2>
            <p className="mt-4 text-base leading-7 text-neutral-300">
              커피 커머스의 핵심 사용자 흐름을 한 화면씩 완성해가는
              프로젝트입니다.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="secondary" asChild>
                <Link href="/">메인으로</Link>
              </Button>
            </div>
          </div>
        </RevealBlock>
      </section>
    </main>
  )
}

function RevealBlock({
  children,
  delay = 0,
}: {
  children: ReactNode
  delay?: number
}) {
  return (
    <div
      data-reveal
      style={{ transitionDelay: `${delay}ms` }}
      className="w-full translate-y-16 scale-[0.96] opacity-0 blur-sm transition-all duration-900 ease-out data-[visible=true]:translate-y-0 data-[visible=true]:scale-100 data-[visible=true]:opacity-100 data-[visible=true]:blur-none"
    >
      {children}
    </div>
  )
}
