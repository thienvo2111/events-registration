"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/utils/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatVND } from "@/lib/format"

type Activity = {
  id: string
  title: string
  description: string | null
  price_member: number | null
  price_non_member: number | null
  max_participants: number | null
  current_participants: number | null
  start_date: string | null
  end_date: string | null
  location: string | null
  status: string | null
  created_at: string
  updated_at: string | null
}

type ActivityWithTotal = Activity & {
  total_count?: number
}

export default function AdminActivitiesPage() {
  const supabase = createSupabaseClient()

  const [activities, setActivities] = useState<ActivityWithTotal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<ActivityWithTotal | null>(null)

  // form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priceMember, setPriceMember] = useState<number | "">("")
  const [priceNonMember, setPriceNonMember] = useState<number | "">("")
  const [maxParticipants, setMaxParticipants] = useState<number | "">("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    loadActivities()
  }, [])

  async function loadActivities() {
    try {
      setLoading(true)
      setError("")

      const { data: activities, error: activitiesError } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })

      if (activitiesError) throw activitiesError

      const list = activities ?? []
      if (list.length === 0) {
        setActivities([])
        return
      }

      const ids = list.map((a) => a.id)

      // lấy attendees theo activity_id, chỉ primary
      const { data: attendees, error: attendeesError } = await supabase
        .from("attendees")
        .select("activity_id")
        .in("activity_id", ids)
        .eq("is_primary", true)

      if (attendeesError) throw attendeesError

      const stats: Record<string, number> = {}
      for (const id of ids) stats[id] = 0
      for (const at of attendees ?? []) {
        stats[at.activity_id] = (stats[at.activity_id] ?? 0) + 1
      }

      const withTotal: ActivityWithTotal[] = list.map((ac) => ({
        ...ac,
        total_count: stats[ac.id] ?? 0,
      }))

      setActivities(withTotal)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải danh sách hoạt động")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setEditing(null)
    setTitle("")
    setDescription("")
    setPriceMember("")
    setPriceNonMember("")
    setMaxParticipants("")
    setLocation("")
    setStartDate("")
    setEndDate("")
  }

  function openCreateForm() {
    resetForm()
    setOpenForm(true)
  }

  function openEditForm(activity: ActivityWithTotal) {
    setEditing(activity)
    setTitle(activity.title)
    setDescription(activity.description ?? "")
    setPriceMember(activity.price_member ?? "")
    setPriceNonMember(activity.price_non_member ?? "")
    setMaxParticipants(activity.max_participants ?? "")
    setLocation(activity.location ?? "")
    setStartDate(activity.start_date ? toLocalInput(activity.start_date) : "")
    setEndDate(activity.end_date ? toLocalInput(activity.end_date) : "")
    setOpenForm(true)
  }

  function toLocalInput(iso: string) {
    const d = new Date(iso)
    const pad = (n: number) => n.toString().padStart(2, "0")
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const payload = {
      title,
      description: description || null,
      price_member: priceMember === "" ? null : Number(priceMember),
      price_non_member: priceNonMember === "" ? null : Number(priceNonMember),
      max_participants: maxParticipants === "" ? null : Number(maxParticipants),
      location: location || null,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
    }

    try {
      if (editing) {
        const { error } = await supabase
          .from("activities")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editing.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("activities").insert(payload)
        if (error) throw error
      }

      setOpenForm(false)
      await loadActivities()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể lưu hoạt động")
    }
  }

  async function handleDelete(activity: ActivityWithTotal) {
    if (!confirm(`Xóa hoạt động "${activity.title}"?`)) return

    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", activity.id)

      if (error) throw error
      await loadActivities()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xóa hoạt động")
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Quản lý hoạt động</h1>
          <p className="mt-1 text-sm text-slate-600">
            Thêm, chỉnh sửa và theo dõi tổng số người đã đăng ký.
          </p>
        </div>
        <Button onClick={openCreateForm}>+ Thêm hoạt động</Button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Lỗi: {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Đang tải...</p>
      ) : activities.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-slate-500">
            Chưa có hoạt động nào. Hãy bấm “Thêm hoạt động”.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activities.map((ac) => (
            <Card key={ac.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{ac.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <div className="space-y-2 text-xs text-slate-600">
                  {ac.description && (
                    <p className="line-clamp-2 text-slate-700">{ac.description}</p>
                  )}
                  <div className="flex justify-between">
                    <span>Giá member</span>
                    <span className="font-semibold text-slate-900">
                      {formatVND(ac.price_member ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Giá non-member</span>
                    <span className="font-semibold text-slate-900">
                      {formatVND(ac.price_non_member ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng đăng ký</span>
                    <span className="font-semibold text-slate-900">
                      {ac.total_count ?? 0}
                      {ac.max_participants !== null && ` / ${ac.max_participants}`}
                    </span>
                  </div>
                  {ac.start_date && (
                    <div className="flex justify-between">
                      <span>Bắt đầu</span>
                      <span>
                        {new Date(ac.start_date).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => openEditForm(ac)}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600"
                    onClick={() => handleDelete(ac)}
                  >
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {openForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-lg">
                {editing ? "Chỉnh sửa hoạt động" : "Thêm hoạt động mới"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Tên hoạt động *
                  </label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Hội thảo kỹ năng mềm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Mô tả</label>
                  <textarea
                    className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Giá member
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={priceMember}
                      onChange={(e) =>
                        setPriceMember(e.target.value === "" ? "" : Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Giá non-member
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={priceNonMember}
                      onChange={(e) =>
                        setPriceNonMember(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Tối đa người tham gia
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={maxParticipants}
                      onChange={(e) =>
                        setMaxParticipants(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Địa điểm
                    </label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="VD: Hội trường A, tầng 3"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Thời gian bắt đầu
                    </label>
                    <Input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Thời gian kết thúc
                    </label>
                    <Input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpenForm(false)
                      resetForm()
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit">
                    {editing ? "Cập nhật hoạt động" : "Tạo hoạt động"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
