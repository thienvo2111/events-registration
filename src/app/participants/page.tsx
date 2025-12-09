"use client"

import { Suspense } from "react"
import ParticipantsContent from "./participants-content"

export default function ParticipantsPage() {
  return (
    <div className="min-h-screen bg-[#3b0008] px-4 py-8 text-amber-50 md:px-6 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Danh sách người tham dự
          </h1>
          <p className="mt-2 text-sm text-amber-100/85">
            Vui lòng truy cập từ trang hoạt động để xem đúng danh sách.
          </p>
        </header>

        <Suspense
          fallback={
            <div className="rounded-lg border border-[#8b1c1f]/50 bg-[#2a0006]/90 p-4 text-sm text-amber-100">
              Đang tải...
            </div>
          }
        >
          <ParticipantsContent />
        </Suspense>
      </div>
    </div>
  )
}
