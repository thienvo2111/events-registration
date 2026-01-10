// src/app/layout.tsx
import type { Metadata } from "next"
import React from "react"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { CartProvider } from "@/context/CartContext"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Event Registration",
  description: "Hệ thống đăng ký sự kiện không cần tạo tài khoản",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      {/* dùng font sans (Inter / hệ thống), không serif */}
      <body className="min-h-screen bg-[#3b0008] font-sans text-slate-50">
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#8b1c1f]/40 bg-[#3b0008]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <img
                  src="images/LOGO.png"
                  alt="Logo NYC2026"
                  className="h-8 w-12"
                />
          <span className="text-sm font-semibold tracking-wide md:text-base">
            2026 JCI VIETNAM NEW YEAR CONVENTION
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-xs md:gap-5 md:text-sm">
          <Link
            href="/events"
            className="rounded-full px-3 py-1 font-medium text-amber-300 hover:bg-amber-300/10"
          >
            Đăng ký
          </Link>
          <Link
            href="/search"
            className="rounded-full px-3 py-1 font-medium text-amber-100/90 hover:bg-amber-100/10"
          >
            Tra cứu đơn hàng
          </Link>
        </nav>
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-[#8b1c1f]/40 bg-[#2a0006]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-amber-100/80 md:flex-row md:items-center md:justify-between md:px-6">
        <p>
          © {new Date().getFullYear()} JCI Vietnam New Year Convention. All
          rights reserved.
        </p>
        <p className="text-[11px]">
          Designed for multi-device: desktop, tablet, mobile.
        </p>
      </div>
    </footer>
  )
}
