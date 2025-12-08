"use client"

import { Suspense } from "react"
import ParticipantsContent from "./participants-content"

export default function ParticipantsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Đang tải...</div>}>
      <ParticipantsContent />
    </Suspense>
  )
}
