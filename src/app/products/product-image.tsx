"use client"

import Image from "next/image"
import { useState } from "react"

import { cn } from "@/lib/utils"

const fallbackImageSrc = "/images/product-fallback.webp"

type ProductImageProps = {
  src: string | null
  alt: string
  className?: string
}

export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState(src || fallbackImageSrc)

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={640}
      height={480}
      className={cn("h-full w-full object-cover object-center", className)}
      draggable={false}
      loading="lazy"
      unoptimized={imageSrc !== fallbackImageSrc}
      onError={() => {
        if (imageSrc !== fallbackImageSrc) {
          setImageSrc(fallbackImageSrc)
        }
      }}
    />
  )
}
