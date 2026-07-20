import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import type { ReactNode } from "react"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "CoffeeProd",
    template: "%s | CoffeeProd",
  },
  description: "취향을 기록하고 오래 기억할 한 잔을 발견하는 커피 커머스",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
try {
  var storedTheme = window.localStorage.getItem("coffeeprod.theme");
  if (storedTheme === "dark") {
    document.documentElement.classList.add("dark");
  }
} catch (_) {}
            `.trim(),
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  )
}
