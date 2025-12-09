"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Countdown } from "@/components/ui/countdown"

export default function LandingPage() {
  return (
    <>
      {/* CSS đổi ảnh mobile/desktop */}
      <style jsx global>{`
        .home-hero {
          background-image: url("/images/home-desktop.png");
        }
        @media (max-width: 767px) {
          .home-hero {
            background-image: url("/images/home-mobile.png");
          }
        }
      `}</style>

      <div
        className="
          home-hero
          relative flex min-h-[calc(100vh-4rem-3rem)] items-center justify-center
          bg-[#3b0008] bg-cover bg-center
        "
      >
        {/* overlay tối cho mọi kích thước */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#3b0008]/95 via-[#3b0008]/55 to-[#3b0008]/85" />

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-15 pt-40 text-center md:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/90 md:text-sm">
               
          </p>

          <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] md:text-5xl lg:text-6xl md:whitespace-nowrap">
            ĐĂNG KÝ THAM GIA SỰ KIỆN
          </h1>

          <Countdown />

          <p className="mt-4 max-w-2xl text-sm font-medium text-amber-100/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] md:text-base">
            Thành phố Hồ Chí Minh, ngày 09 - 11 tháng 01 năm 2026
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/events">
              <Button className="w-full rounded-full bg-amber-400 px-8 py-6 text-base font-semibold text-[#3b0008] hover:bg-amber-300 sm:w-auto">
                Đăng ký tham gia
              </Button>
            </Link>
            <Link href="/search">
              <Button
                variant="outline"
                className="w-full rounded-full border-amber-200/80 bg-[#3b0008]/60 px-8 py-6 text-base font-semibold text-amber-100 hover:bg-amber-100/10 sm:w-auto"
              >
                Tra cứu đơn hàng
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
