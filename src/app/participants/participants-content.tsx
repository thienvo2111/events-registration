"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"

type AttendeeRow = {
  id: string
  full_name: string | null
  title: string | null        // chức vụ
  unit_name: string | null    // chapter
}

export default function ParticipantsContent() {
  const searchParams = useSearchParams()
  const activityId = searchParams.get("activity_id")

  const [attendees, setAttendees] = useState<AttendeeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activityId) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.rpc(
          "get_attendees_by_activity",
          { p_activity_id: activityId }
        )

        if (error) throw error
        setAttendees(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [activityId])

  if (!activityId) {
    return (
      <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-4 text-sm text-amber-100">
        Vui lòng truy cập trang này từ trang hoạt động (có truyền activity_id).
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-4 text-sm text-amber-100">
        Đang tải danh sách người tham gia...
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-500/60 bg-red-900/40 p-4 text-sm text-red-200">
        Lỗi khi tải dữ liệu: {error}
      </Card>
    )
  }

  if (attendees.length === 0) {
    return (
      <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-4 text-sm text-amber-100">
        Chưa có người tham gia nào cho hoạt động này.
      </Card>
    )
  }

  return (
    <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-4 text-sm text-amber-50 md:p-5">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead>
            <tr className="border-b border-[#8b1c1f]/40 bg-black/20 text-amber-200">
              <th className="px-3 py-2 font-semibold">STT</th>
              <th className="px-3 py-2 font-semibold">Họ tên</th>
              <th className="px-3 py-2 font-semibold">Chapter</th>
              <th className="px-3 py-2 font-semibold">Chức vụ</th>
            </tr>
          </thead>
          <tbody>
            {attendees.map((attendee, idx) => (
              <tr
                key={attendee.id}
                className={
                  idx % 2 === 0
                    ? "border-b border-[#8b1c1f]/30 bg-black/10"
                    : "border-b border-[#8b1c1f]/30 bg-black/0"
                }
              >
                <td className="px-3 py-2">{idx + 1}</td>
                <td className="px-3 py-2">
                  {attendee.full_name ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {attendee.unit_name ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {attendee.title ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
