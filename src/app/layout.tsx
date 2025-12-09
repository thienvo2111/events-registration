// src/app/layout.tsx
import type { Metadata } from "next"
import React from "react"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { CartProvider } from "@/context/CartContext"

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
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {/* Provider bọc toàn bộ ứng dụng để useCart hoạt động ở mọi trang */}
        <CartProvider>
          {children}
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}
