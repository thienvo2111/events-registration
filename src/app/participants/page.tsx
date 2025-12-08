"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type ParticipantRow = {
  id: string
  order: {
    registration: {
      full_name: string
      unit: {
        name: string | null
      } | null
    } | null
  } | null
  activity: {
    title: string
  } | null
}

export default function ParticipantsPage() {
  const searchParams = useSearchParams()
  const activityId = searchParams.get("activity_id")

  const [rows, setRows] = useState<ParticipantRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activityId) return

    const load = async () => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("attendees")
        .select(
          `
          id,
          order:orders (
            registration:registrations (
              full_name,
              unit:units (
                name
              )
            )
          ),
          activity:activities (
            title
          )
        `,
        )
        .eq("activity_id", activityId)
        .eq("is_primary", true)
        .order("id", { ascending: true })

      if (error) {
        console.error(error)
        setError(error.message)
        setRows([])
      } else {
        setRows((data as ParticipantRow[]) || [])
      }

      setLoading(false)
    }

    load()
  }, [activityId])

  const activityTitle = rows[0]?.activity?.title ?? "Hoạt động"

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Link href="/events">
              <Button variant="ghost">⬅ Quay lại hoạt động</Button>
            </Link>
            <h1 className="text-xl font-semibold text-slate-900">
              Người tham gia
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {!activityId && (
          <Card className="p-6 text-sm text-slate-700">
            Vui lòng truy cập trang này từ trang hoạt động (có
            truyền activity_id).
          </Card>
        )}

        {activityId && (
          <>
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              {activityTitle}
            </h2>

            {loading && (
              <p className="text-sm text-slate-600">
                Đang tải danh sách người tham gia...
              </p>
            )}

            {error && (
              <Card className="mb-4 border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Lỗi khi tải dữ liệu: {error}
              </Card>
            )}

            {!loading && !error && rows.length === 0 && (
              <Card className="p-4 text-sm text-slate-600">
                Chưa có người tham gia nào cho hoạt động này.
              </Card>
            )}

            {!loading && !error && rows.length > 0 && (
              <Card className="divide-y border-slate-200 bg-white">
                <div className="flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                  <span className="w-1/3">Người đặt</span>
                  <span className="w-1/3">Đơn vị</span>
                  <span className="w-1/3 text-right">Loại</span>
                </div>
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between px-4 py-2 text-sm"
                  >
                    <span className="w-1/3 truncate">
                      {row.order?.registration?.full_name ?? "—"}
                    </span>
                    <span className="w-1/3 truncate text-slate-700">
                      {row.order?.registration?.unit?.name ?? "—"}
                    </span>
                  </div>
                ))}
              </Card>
            )}

            <p className="mt-4 text-xs text-slate-500">
     
            </p>
          </>
        )}
      </main>
    </div>
  )
}
