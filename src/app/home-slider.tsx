"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react"
import {
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

import { Button } from "@/components/ui/button"

import { ProductImage } from "./products/product-image"

export type HomeSlide = {
  id: string
  eyebrow: string
  title: string
  description: string
  href: string
  imageUrl: string | null
  ctaLabel: string
}

type HomeSliderProps = {
  slides: HomeSlide[]
}

export function HomeSlider({ slides }: HomeSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const rotationPointerStateRef = useRef<boolean | null>(null)
  const rotationButtonRef = useRef<HTMLButtonElement>(null)
  const previousButtonRef = useRef<HTMLButtonElement>(null)
  const subscribeMotion = useCallback((onChange: () => void) => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    function handleChange() {
      if (query.matches && document.activeElement === rotationButtonRef.current) {
        previousButtonRef.current?.focus({ preventScroll: true })
      }
      setIsPlaying(false)
      onChange()
    }
    query.addEventListener("change", handleChange)
    return () => query.removeEventListener("change", handleChange)
  }, [])
  const prefersReducedMotion = useSyncExternalStore(
    subscribeMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )
  const dragStartXRef = useRef<number | null>(null)
  const suppressClickRef = useRef(false)
  const safeSlides = slides.length > 0 ? slides : fallbackSlides
  const activeSlide = safeSlides[activeIndex] ?? safeSlides[0]

  useEffect(() => {
    if (safeSlides.length <= 1 || !isPlaying || isHovered || prefersReducedMotion) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeSlides.length)
    }, 4500)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [safeSlides.length, isPlaying, isHovered, prefersReducedMotion])

  function moveSlide(direction: -1 | 1) {
    setIsPlaying(false)
    setActiveIndex((current) => {
      const nextIndex = current + direction

      if (nextIndex < 0) {
        return safeSlides.length - 1
      }

      return nextIndex % safeSlides.length
    })
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    dragStartXRef.current = event.clientX
    suppressClickRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    const dragStartX = dragStartXRef.current

    dragStartXRef.current = null

    if (dragStartX === null) {
      return
    }

    const distance = event.clientX - dragStartX

    if (Math.abs(distance) < 48) {
      return
    }

    suppressClickRef.current = true
    moveSlide(distance > 0 ? -1 : 1)
  }

  function handlePointerCancel() {
    dragStartXRef.current = null
  }

  function handleSlideClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!suppressClickRef.current) {
      return
    }

    event.preventDefault()
    suppressClickRef.current = false
  }

  function handleControlClick(
    event: MouseEvent<HTMLButtonElement>,
    direction: -1 | 1
  ) {
    event.preventDefault()
    event.stopPropagation()
    dragStartXRef.current = null
    suppressClickRef.current = false
    moveSlide(direction)
  }

  return (
    <section
      className="journal-slider"
      aria-label="추천 콘텐츠"
      aria-roledescription="슬라이드 모음"
      onFocusCapture={() => setIsPlaying(false)}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setIsHovered(true)
      }}
      onPointerLeave={() => setIsHovered(false)}
    >
      <div className="journal-slider-layout">
        <div
          className="journal-slider-media"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <Link
            href={activeSlide.href}
            className="block h-full touch-pan-y select-none"
            aria-label={activeSlide.title}
            onClick={handleSlideClick}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
          >
            <ProductImage
              key={activeSlide.id}
              src={activeSlide.imageUrl}
              alt={activeSlide.title}
              className="journal-slider-image"
              sizes="(max-width: 700px) 100vw, 65vw"
            />
          </Link>
          {safeSlides.length > 1 && (
            <div className="journal-slider-overlay-controls">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="pointer-events-auto"
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                onClick={(event) => handleControlClick(event, -1)}
                aria-label="이전 슬라이드"
              >
                <ArrowLeft />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="pointer-events-auto"
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                onClick={(event) => handleControlClick(event, 1)}
                aria-label="다음 슬라이드"
              >
                <ArrowRight />
              </Button>
            </div>
          )}
        </div>

        <div className="journal-slider-copy">
          <div>
            <p className="editorial-kicker">{activeSlide.eyebrow}</p>
            <h3>
              {activeSlide.title}
            </h3>
            <p className="journal-slider-description">
              {activeSlide.description}
            </p>
          </div>

          <div className="journal-slider-footer">
            <Button variant="outline" asChild>
              <Link href={activeSlide.href}>
                {activeSlide.ctaLabel}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>

            {safeSlides.length > 1 && (
              <div className="journal-slider-controls">
                {prefersReducedMotion ? (
                  <p className="text-sm text-muted-foreground">
                    동작 줄이기 설정으로 자동 재생을 멈췄습니다.
                  </p>
                ) : (
                  <Button
                    ref={rotationButtonRef}
                    type="button"
                    variant="outline"
                    onPointerDown={() => {
                      rotationPointerStateRef.current = isPlaying
                    }}
                    onPointerCancel={() => {
                      rotationPointerStateRef.current = null
                    }}
                    onClick={(event) => {
                      const wasPlaying = event.detail > 0
                        ? rotationPointerStateRef.current ?? isPlaying
                        : isPlaying
                      rotationPointerStateRef.current = null
                      setIsPlaying(!wasPlaying)
                    }}
                  >
                    {isPlaying ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}
                    {isPlaying ? "자동 재생 정지" : "자동 재생"}
                  </Button>
                )}
                <div className="journal-slider-counter">
                  <Button
                    ref={previousButtonRef}
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={(event) => handleControlClick(event, -1)}
                    aria-label="이전 슬라이드"
                  >
                    <ArrowLeft />
                  </Button>
                  <span aria-live={isPlaying && !prefersReducedMotion ? "off" : "polite"} aria-atomic="true">
                    {activeIndex + 1} / {safeSlides.length}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={(event) => handleControlClick(event, 1)}
                    aria-label="다음 슬라이드"
                  >
                    <ArrowRight />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function getReducedMotionServerSnapshot() {
  return true
}

const fallbackSlides: HomeSlide[] = [
  {
    id: "event-shipping",
    eyebrow: "Membership",
    title: "신규 회원 첫 주문 혜택",
    description: "회원가입 후 배송지와 장바구니를 준비하고 첫 주문 플로우를 확인하세요.",
    href: "/signup",
    imageUrl: null,
    ctaLabel: "회원가입",
  },
]
