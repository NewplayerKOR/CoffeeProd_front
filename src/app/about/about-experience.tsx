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
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const values = [
  {
    title: "원두를 고르는 순간",
    description:
      "좋아하는 향과 로스팅을 천천히 살펴보며 오늘의 취향에 맞는 원두를 발견하세요.",
    icon: Coffee,
  },
  {
    title: "주문이 편안해지는 순간",
    description:
      "원하는 분쇄도와 수량을 고르고, 익숙한 배송지로 부담 없이 주문을 이어갑니다.",
    icon: ShoppingCart,
  },
  {
    title: "기다림마저 설레는 순간",
    description:
      "안심할 수 있는 결제부터 문 앞에 도착하는 순간까지, 주문의 여정을 함께합니다.",
    icon: CreditCard,
  },
]

const flowSteps = [
  { label: "원두 고르기", icon: Coffee },
  { label: "취향 담기", icon: ShoppingCart },
  { label: "배송지 선택", icon: MapPin },
  { label: "편안한 결제", icon: CreditCard },
  { label: "설레는 배송", icon: Truck },
]

const sections = [
  { id: "intro", label: "Intro" },
  { id: "state", label: "State" },
  { id: "flow", label: "Flow" },
  { id: "detail", label: "Detail" },
  { id: "end", label: "CoffeeProd" },
]

const sectionIds = sections.map((section) => section.id)
const desktopStageMediaQuery = "(min-width: 1024px) and (min-height: 700px)"
const reducedMotionMediaQuery = "(prefers-reduced-motion: reduce)"
const sectionTransitionDuration = 920

export function AboutExperience() {
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const heroRef = useRef<HTMLElement | null>(null)
  const activeSectionRef = useRef("intro")
  const isScrollLockedRef = useRef(false)
  const sectionTransitionTimerRef = useRef<number | null>(null)
  const transitionCooldownUntilRef = useRef(0)
  const wheelDeltaRef = useRef(0)
  const wheelGestureTriggeredRef = useRef(false)
  const wheelGestureReleaseTimerRef = useRef<number | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 })
  const [activeSection, setActiveSection] = useState("intro")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )
  const isDesktopStage = useSyncExternalStore(
    subscribeDesktopStage,
    getDesktopStageSnapshot,
    getDesktopStageServerSnapshot
  )

  const scrollToSection = useCallback(
    (sectionId: string) => {
      const section = scrollContainerRef.current?.querySelector<HTMLElement>(
        `[data-section-id="${sectionId}"]`
      )

      if (!section) {
        return
      }

      if (
        sectionId === activeSectionRef.current ||
        isScrollLockedRef.current
      ) {
        return
      }

      activeSectionRef.current = sectionId
      setActiveSection(sectionId)

      if (!isDesktopStage) {
        section.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        })
        return
      }

      if (sectionTransitionTimerRef.current !== null) {
        window.clearTimeout(sectionTransitionTimerRef.current)
      }

      isScrollLockedRef.current = true
      setIsTransitioning(true)
      sectionTransitionTimerRef.current = window.setTimeout(
        () => {
          isScrollLockedRef.current = false
          transitionCooldownUntilRef.current = window.performance.now() + 280
          sectionTransitionTimerRef.current = null
          setIsTransitioning(false)
        },
        prefersReducedMotion ? 240 : sectionTransitionDuration
      )
    },
    [isDesktopStage, prefersReducedMotion]
  )

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

    if (isDesktopStage) {
      for (const element of animatedElements) {
        element.setAttribute("data-visible", "true")
      }

      return
    }

    const revealObserver = prefersReducedMotion
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                entry.target.setAttribute("data-visible", "true")
                revealObserver?.unobserve(entry.target)
              }
            }
          },
          {
            rootMargin: "0px 0px -12% 0px",
            threshold: 0.18,
          }
        )
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visibleEntry) {
          const sectionId = visibleEntry.target.getAttribute("data-section-id")

          if (sectionId) {
            activeSectionRef.current = sectionId
            setActiveSection(sectionId)
          }
        }
      },
      {
        threshold: [0.45, 0.6, 0.75],
      }
    )

    for (const element of animatedElements) {
      if (revealObserver) {
        revealObserver.observe(element)
      } else {
        element.setAttribute("data-visible", "true")
      }
    }

    for (const element of sectionElements) {
      sectionObserver.observe(element)
    }

    return () => {
      revealObserver?.disconnect()
      sectionObserver.disconnect()
    }
  }, [isDesktopStage, prefersReducedMotion])

  useEffect(() => {
    const desktopQuery = window.matchMedia(desktopStageMediaQuery)

    function moveBySection(direction: -1 | 1) {
      const currentIndex = Math.max(
        sectionIds.indexOf(activeSectionRef.current),
        0
      )
      const nextIndex = Math.min(
        Math.max(currentIndex + direction, 0),
        sectionIds.length - 1
      )

      if (nextIndex !== currentIndex) {
        scrollToSection(sectionIds[nextIndex])
      }
    }

    function handleWheel(event: WheelEvent) {
      if (!desktopQuery.matches || event.ctrlKey) {
        return
      }

      event.preventDefault()

      if (wheelGestureReleaseTimerRef.current !== null) {
        window.clearTimeout(wheelGestureReleaseTimerRef.current)
      }

      wheelGestureReleaseTimerRef.current = window.setTimeout(() => {
        wheelDeltaRef.current = 0
        wheelGestureTriggeredRef.current = false
        wheelGestureReleaseTimerRef.current = null
      }, 320)

      if (
        isScrollLockedRef.current ||
        wheelGestureTriggeredRef.current ||
        window.performance.now() < transitionCooldownUntilRef.current
      ) {
        return
      }

      wheelDeltaRef.current += event.deltaY

      if (Math.abs(wheelDeltaRef.current) < 36) {
        return
      }

      const direction = wheelDeltaRef.current > 0 ? 1 : -1
      wheelDeltaRef.current = 0
      wheelGestureTriggeredRef.current = true
      moveBySection(direction)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!desktopQuery.matches || isScrollLockedRef.current) {
        return
      }

      const target = event.target
      const isTextInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)

      if (isTextInput) {
        return
      }

      if (event.key === "Home") {
        event.preventDefault()
        scrollToSection(sectionIds[0])
        return
      }

      if (event.key === "End") {
        event.preventDefault()
        scrollToSection(sectionIds[sectionIds.length - 1])
        return
      }

      const movesForward =
        event.key === "PageDown" ||
        event.key === "ArrowDown" ||
        (event.key === " " && !event.shiftKey)
      const movesBackward =
        event.key === "PageUp" ||
        event.key === "ArrowUp" ||
        (event.key === " " && event.shiftKey)

      if (!movesForward && !movesBackward) {
        return
      }

      if (
        event.key === " " &&
        target instanceof HTMLElement &&
        target.closest("button, a")
      ) {
        return
      }

      event.preventDefault()
      moveBySection(movesForward ? 1 : -1)
    }

    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("keydown", handleKeyDown)

      if (wheelGestureReleaseTimerRef.current !== null) {
        window.clearTimeout(wheelGestureReleaseTimerRef.current)
      }
    }
  }, [scrollToSection])

  useEffect(() => {
    if (isDesktopStage) {
      window.scrollTo({ top: 0, behavior: "auto" })
    }
  }, [isDesktopStage])

  useEffect(() => {
    return () => {
      if (sectionTransitionTimerRef.current !== null) {
        window.clearTimeout(sectionTransitionTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!heroRef.current || prefersReducedMotion || isDesktopStage) {
      return
    }

    let animationFrame = 0

    function updateScrollProgress() {
      const hero = heroRef.current

      if (!hero) {
        return
      }

      const heroTop = hero.getBoundingClientRect().top

      const progress = Math.min(
        Math.max(-heroTop / Math.max(hero.offsetHeight, 1), 0),
        1
      )

      setScrollProgress(progress)
    }

    function scheduleScrollProgressUpdate() {
      if (animationFrame) {
        return
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0
        updateScrollProgress()
      })
    }

    scheduleScrollProgressUpdate()
    window.addEventListener("scroll", scheduleScrollProgressUpdate, {
      passive: true,
    })
    window.addEventListener("resize", scheduleScrollProgressUpdate)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener("scroll", scheduleScrollProgressUpdate)
      window.removeEventListener("resize", scheduleScrollProgressUpdate)
    }
  }, [isDesktopStage, prefersReducedMotion])

  const activeSectionIndex = Math.max(
    sectionIds.indexOf(activeSection),
    0
  )

  return (
    <main
      ref={scrollContainerRef}
      data-stage={isDesktopStage}
      data-transitioning={isTransitioning}
      className="about-experience min-h-dvh"
    >
      <header className="about-header fixed left-0 right-0 top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="about-wordmark flex items-center gap-2 font-semibold">
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
        className="about-section-nav fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 md:flex"
        aria-label="소개 페이지 섹션"
      >
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className="group flex items-center justify-end gap-2"
            onClick={() => scrollToSection(section.id)}
            aria-label={`${section.label} 섹션으로 이동`}
            aria-current={activeSection === section.id ? "location" : undefined}
          >
            <span className="about-section-label text-xs font-medium transition-colors">
              {section.label}
            </span>
            <span
              className={cn(
                "about-section-dot",
                activeSection === section.id && "is-active"
              )}
            />
          </button>
        ))}
      </nav>
      <div className="about-stage-curtain" aria-hidden="true" />

      <section
        ref={heroRef}
        data-section-id="intro"
        data-index="01"
        data-active={activeSection === "intro"}
        data-position={getSectionPosition(0, activeSectionIndex)}
        className="about-section about-section-hero relative flex min-h-dvh items-end overflow-hidden px-6 pb-16 pt-28"
        onPointerMove={(event) => {
          if (prefersReducedMotion) {
            return
          }

          const rect = event.currentTarget.getBoundingClientRect()
          setPointerOffset({
            x: (event.clientX - rect.left) / rect.width - 0.5,
            y: (event.clientY - rect.top) / rect.height - 0.5,
          })
        }}
      >
        <div
          className="about-hero-image absolute inset-0 bg-cover bg-center"
          style={
            prefersReducedMotion || isDesktopStage
              ? { backgroundImage: "url('/images/hero-coffee-bg.svg')" }
              : {
                  backgroundImage: "url('/images/hero-coffee-bg.svg')",
                  transform: `scale(${1 + scrollProgress * 0.12}) translateY(${
                    scrollProgress * 36
                  }px)`,
                }
          }
        />
        <div className="about-hero-shade absolute inset-0" />
        <div className="about-hero-fade absolute inset-x-0 bottom-0 h-48" />
        <div
          className="about-hero-orbit absolute right-[8%] top-[22%] hidden h-52 w-52 rounded-full border backdrop-blur md:block"
          style={
            prefersReducedMotion
              ? undefined
              : {
                  transform: `translate(${pointerOffset.x * 32}px, ${
                    pointerOffset.y * 32
                  }px) rotate(${scrollProgress * 22}deg)`,
                }
          }
        />
        <div
          className="about-hero-tile absolute right-[19%] top-[40%] hidden h-28 w-28 rounded-lg border backdrop-blur md:block"
          style={
            prefersReducedMotion
              ? undefined
              : {
                  transform: `translate(${pointerOffset.x * -42}px, ${
                    pointerOffset.y * -30
                  }px) rotate(${-10 - scrollProgress * 18}deg)`,
                }
          }
        />

        <div className="about-section-content relative mx-auto w-full max-w-6xl">
          <div
            className="max-w-3xl"
            style={
              prefersReducedMotion || isDesktopStage
                ? undefined
                : {
                    transform: `translateY(${scrollProgress * -20}px) scale(${
                      1 - scrollProgress * 0.035
                    })`,
              }
            }
          >
            <RevealBlock variant="hero">
              <p className="about-accent flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4" />
                Coffee for your everyday
              </p>
              <h1 className="mt-5 text-5xl font-bold leading-tight md:text-7xl">
                오늘의 취향에 꼭 맞는 커피를 만나는 시간.
              </h1>
              <p className="about-hero-copy mt-6 max-w-2xl text-lg leading-8">
                원두를 고르는 설렘부터 향긋한 한 잔이 완성되는 순간까지,
                CoffeeProd가 당신의 커피 여정을 함께합니다.
              </p>
            </RevealBlock>
          </div>
        </div>
      </section>

      <section
        data-section-id="state"
        data-index="02"
        data-active={activeSection === "state"}
        data-position={getSectionPosition(1, activeSectionIndex)}
        className="about-section about-section-dark min-h-dvh px-6 py-24"
      >
        <div className="about-section-content mx-auto grid min-h-[calc(100dvh-12rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <RevealBlock variant="left">
            <p className="about-accent text-sm font-semibold">Our promise</p>
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              좋은 커피를 만나는 모든 순간이 자연스럽도록.
            </h2>
          </RevealBlock>

          <div className="grid gap-4">
            {values.map((value, index) => {
              const Icon = value.icon

              return (
                <RevealBlock
                  key={value.title}
                  delay={index * 140}
                  variant="right"
                >
                  <article className="about-value-card group rounded-lg border p-5">
                    <div className="flex items-start gap-4">
                      <div className="about-value-icon flex size-11 shrink-0 items-center justify-center rounded-lg">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{value.title}</h3>
                        <p className="about-copy-muted mt-2 text-sm leading-6">
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
        data-index="03"
        data-active={activeSection === "flow"}
        data-position={getSectionPosition(2, activeSectionIndex)}
        className="about-section about-section-light relative min-h-dvh border-y"
      >
        <div className="about-flow-wash absolute inset-0" />
        <div className="about-section-content relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center px-6 py-24">
          <RevealBlock variant="left">
            <p className="about-light-kicker text-sm font-semibold">From bean to cup</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              당신의 한 잔이 찾아오는 길을 정성스럽게 잇습니다.
            </h2>
          </RevealBlock>

          <div className="mt-14 grid gap-3 md:grid-cols-5">
            {flowSteps.map((step, index) => {
              const Icon = step.icon

              return (
                <RevealBlock
                  key={step.label}
                  delay={index * 110}
                  variant="scale"
                >
                  <div className="about-flow-card relative rounded-lg border p-5">
                    <div className="about-flow-icon flex size-12 items-center justify-center rounded-lg">
                      <Icon className="size-5" />
                    </div>
                    <p className="about-light-muted mt-5 text-sm font-medium">
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
        data-index="04"
        data-active={activeSection === "detail"}
        data-position={getSectionPosition(3, activeSectionIndex)}
        className="about-section about-section-deep min-h-dvh px-6 py-24"
      >
        <div className="about-section-content mx-auto grid min-h-[calc(100dvh-12rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <RevealBlock variant="left">
            <div className="about-detail-media relative min-h-[460px] overflow-hidden rounded-lg border">
              <div className="absolute inset-0 bg-[url('/images/hero-coffee-bg.svg')] bg-cover bg-center opacity-70" />
              <div className="about-detail-shade absolute inset-0" />
              <div className="about-detail-caption absolute bottom-6 left-6 right-6 rounded-lg p-5 backdrop-blur">
                <p className="about-accent text-sm font-medium">Always connected</p>
                <h3 className="mt-2 text-2xl font-bold">멈춘 주문도 편안하게 이어서</h3>
                <p className="about-copy-muted mt-3 text-sm leading-6">
                  잠시 결제를 멈췄더라도 걱정하지 마세요. 주문 내역에서 다시
                  이어가거나 마음이 바뀌면 편하게 취소할 수 있습니다.
                </p>
              </div>
            </div>
          </RevealBlock>

          <RevealBlock delay={180} variant="right">
            <p className="about-accent text-sm font-semibold">After your order</p>
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              좋은 경험은 주문 이후에도 이어집니다.
            </h2>
            <p className="about-copy-muted mt-6 text-base leading-8">
              장바구니에 담은 순간부터 결제와 배송을 기다리는 시간까지,
              CoffeeProd는 필요한 정보를 놓치지 않고 다음 순간을 자연스럽게
              안내합니다.
            </p>
            <Button className="mt-8" asChild>
              <Link href="/products">
                나의 원두 찾기
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </RevealBlock>
        </div>
      </section>

      <section
        data-section-id="end"
        data-index="05"
        data-active={activeSection === "end"}
        data-position={getSectionPosition(4, activeSectionIndex)}
        className="about-section about-section-end flex min-h-dvh items-center justify-center border-t px-6 py-20"
      >
        <RevealBlock variant="scale">
          <div className="about-section-content mx-auto flex max-w-3xl flex-col items-center text-center">
            <PackageCheck className="about-accent size-10" />
            <h2 className="mt-5 text-4xl font-bold">CoffeeProd</h2>
            <p className="about-copy-muted mt-4 text-base leading-7">
              평범한 하루에도 오래 기억될 향이 있습니다.<br />
              당신의 취향에 머무는 한 잔을 CoffeeProd에서 만나보세요.
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
  variant = "up",
}: {
  children: ReactNode
  delay?: number
  variant?: "hero" | "left" | "right" | "scale" | "up"
}) {
  return (
    <div
      data-reveal
      data-reveal-variant={variant}
      style={{ transitionDelay: `${delay}ms` }}
      className="about-reveal w-full"
    >
      {children}
    </div>
  )
}

function getSectionPosition(sectionIndex: number, activeSectionIndex: number) {
  if (sectionIndex === activeSectionIndex) {
    return "active"
  }

  return sectionIndex < activeSectionIndex ? "before" : "after"
}

function subscribeDesktopStage(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(desktopStageMediaQuery)
  mediaQuery.addEventListener("change", onStoreChange)

  return () => mediaQuery.removeEventListener("change", onStoreChange)
}

function getDesktopStageSnapshot() {
  return window.matchMedia(desktopStageMediaQuery).matches
}

function getDesktopStageServerSnapshot() {
  return false
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionMediaQuery)
  mediaQuery.addEventListener("change", onStoreChange)

  return () => mediaQuery.removeEventListener("change", onStoreChange)
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionMediaQuery).matches
}

function getReducedMotionServerSnapshot() {
  return false
}
