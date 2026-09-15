"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

import {
  PRODUCT_IMAGE_FALLBACK_SRC,
  resolveProductImageRenderSource,
  resolveProductImageSource,
} from "@/lib/product-image-policy"
import { cn } from "@/lib/utils"

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
  const resolvedSource = resolveProductImageSource(src)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const imageSource = resolveProductImageRenderSource(src, failedSource)

  return (
    <Image
      src={imageSource}
      alt={alt}
      width={1024}
      height={1024}
      sizes={sizes}
      quality={75}
      className={cn("h-full w-full object-cover object-center", className)}
      draggable={false}
      loading={loading}
      fetchPriority={fetchPriority}
      onError={() => {
        if (imageSource !== PRODUCT_IMAGE_FALLBACK_SRC) {
          setFailedSource(resolvedSource)
        }
      }}
    />
  )
}
