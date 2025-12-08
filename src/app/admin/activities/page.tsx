"use client"

import { useEffect, useState } from "react"

import { createSupabaseClient } from "@/utils/supabase/client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { formatVND } from "@/lib/format"

import { Activity, Attendee } from "@/lib/types"

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
  const [priceMember, setPriceMember] = useState<string | number>("")
  const [priceNonMember, setPriceNonMember] = useState<string | number>("")
  const [maxParticipants, setMaxParticipants] = useState<string | number>("")
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

      const list = (activities ?? []) as Activity[]

      if (list.length === 0) {
        setActivities([])
        return
      }

      // FIX: Add type annotation for parameter 'a'
      const ids = list.map((a: Activity) => a.id)

      // lấy attendees theo activity_id, chỉ primary
      const { data: attendees, error: attendeesError } = await supabase
        .from("attendees")
        .select("activity_id")
        .in("activity_id", ids)
        .eq("is_primary", true)

      if (attendeesError) throw attendeesError

      // FIX: Add proper generic type for Record
      const stats: Record<string, number> = {}
      for (const id of ids) stats[id] = 0

      // FIX: Add type annotation for parameter 'at'
      for (const at of (attendees ?? []) as Attendee[]) {
        stats[at.activity_id] = (stats[at.activity_id] ?? 0) + 1
      }

      const withTotal: ActivityWithTotal[] = list.map((ac: Activity) => ({
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý hoạt động</h1>
          <p className="text-gray-600">
            Thêm, chỉnh sửa và theo dõi tổng số người đã đăng ký.
          </p>
        </div>
        <Button onClick={openCreateForm} className="bg-blue-600 hover:bg-blue-700">
          + Thêm hoạt động
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Lỗi: {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Đang tải...</div>
      ) : activities.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Chưa có hoạt động nào. Hãy bấm "Thêm hoạt động".
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {activities.map((ac) => (
            <Card key={ac.id}>
              <CardHeader>
                <CardTitle>{ac.title}</CardTitle>
                {ac.description && (
                  <p className="text-sm text-gray-600 mt-2">{ac.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Giá member</p>
                    <p className="font-semibold">{formatVND(ac.price_member ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Giá non-member</p>
                    <p className="font-semibold">{formatVND(ac.price_non_member ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tổng đăng ký</p>
                    <p className="font-semibold">
                      {ac.total_count ?? 0}
                      {ac.max_participants !== null && ` / ${ac.max_participants}`}
                    </p>
                  </div>
                  {ac.start_date && (
                    <div>
                      <p className="text-xs text-gray-500">Bắt đầu</p>
                      <p className="font-semibold">
                        {new Date(ac.start_date).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => openEditForm(ac)}
                    variant="outline"
                    size="sm"
                  >
                    Sửa
                  </Button>
                  <Button
                    onClick={() => handleDelete(ac)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
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
        <Card className="fixed inset-0 m-4 z-50 overflow-y-auto">
          <CardHeader>
            <CardTitle>
              {editing ? "Chỉnh sửa hoạt động" : "Thêm hoạt động mới"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên hoạt động *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Hội thảo kỹ năng mềm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết về hoạt động"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Giá member</label>
                <Input
                  type="number"
                  value={priceMember}
                  onChange={(e) =>
                    setPriceMember(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Giá non-member
                </label>
                <Input
                  type="number"
                  value={priceNonMember}
                  onChange={(e) =>
                    setPriceNonMember(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tối đa người tham gia
                </label>
                <Input
                  type="number"
                  value={maxParticipants}
                  onChange={(e) =>
                    setMaxParticipants(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Địa điểm</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="VD: Hội trường A, tầng 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Thời gian bắt đầu
                </label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Thời gian kết thúc
                </label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end">
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
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editing ? "Cập nhật hoạt động" : "Tạo hoạt động"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
