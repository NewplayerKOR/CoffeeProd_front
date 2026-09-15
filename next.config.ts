import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      new URL(
        "https://assets-coffeeprod.ttagyulab.com/products/catalog/**"
      ),
    ],
    qualities: [75],
    minimumCacheTTL: 31_536_000,
    maximumRedirects: 0,
  },
}

export default nextConfig
