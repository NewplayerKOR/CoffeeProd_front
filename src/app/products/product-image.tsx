"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

import { cn } from "@/lib/utils"

const fallbackImageSrc = "/images/product-fallback.webp"

type ProductImageProps = {
  src: string | null
  alt: string
  className?: string
  sizes?: string
  loading?: ImageProps["loading"]
  fetchPriority?: ImageProps["fetchPriority"]
}

export function ProductImage({
  src,
  alt,
  className,
  sizes = "100vw",
  loading,
  fetchPriority,
}: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState(src || fallbackImageSrc)

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={640}
      height={480}
      sizes={sizes}
      className={cn("h-full w-full object-cover object-center", className)}
      draggable={false}
      loading={loading}
      fetchPriority={fetchPriority}
      unoptimized={isExternalImage(imageSrc)}
      onError={() => {
        if (imageSrc !== fallbackImageSrc) {
          setImageSrc(fallbackImageSrc)
        }
      }}
    />
  )
}

function isExternalImage(src: string) {
  return src.startsWith("http://") || src.startsWith("https://")
}
