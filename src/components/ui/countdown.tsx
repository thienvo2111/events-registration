"use client"

import { useEffect, useState } from "react"

const TARGET = new Date("2026-01-10T00:00:00+07:00").getTime()

function format(num: number) {
  return num.toString().padStart(2, "0")
}

export function Countdown() {
  const [diff, setDiff] = useState(TARGET - Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setDiff(TARGET - Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [])

  if (diff <= 0) return null

  const totalSec = Math.floor(diff / 1000)
  const days = Math.floor(totalSec / (60 * 60 * 24))
  const hours = Math.floor((totalSec % (60 * 60 * 24)) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  return (
    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/35 px-4 py-2 text-xs font-medium text-amber-100 md:text-sm">
      <span className="uppercase tracking-[0.2em] text-amber-200/90">
        Còn:
      </span>
      <span className="tabular-nums">
        {days} ngày {format(hours)}:{format(minutes)}:{format(seconds)}
      </span>
      <span className="uppercase tracking-[0.2em] text-amber-200/90">
        đến ngày diễn ra sự kiện.
      </span>
    </div>
  )
}
