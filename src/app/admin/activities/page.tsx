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
  const [status, setStatus] = useState("active")

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
    setStatus("active")
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
    setStatus(activity.status ?? "active")
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
      price_member: priceMember === "" ? 0 : Number(priceMember),
      price_non_member: priceNonMember === "" ? null : Number(priceNonMember),
      max_participants: maxParticipants === "" ? null : Number(maxParticipants),
      current_participants: 0,
      location: location || null,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      status,
    }

    try {
      if (editing) {
        // Remove current_participants from update payload to avoid resetting it
        const { current_participants, ...updatePayload } = payload
        const { error } = await supabase
          .from("activities")
          .update({ ...updatePayload, updated_at: new Date().toISOString() })
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
    <div className="min-h-screen bg-[#3b0008] px-4 py-8 text-amber-50 md:px-6">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-amber-200 font-serif">Quản lý hoạt động</h1>
          <p className="text-amber-100/60 text-sm max-w-2xl leading-relaxed">
            Thêm, chỉnh sửa và theo dõi tổng số người đã đăng ký.
          </p>
        </div>
        <Button onClick={openCreateForm} className="bg-blue-600 hover:bg-blue-700">
          + Thêm hoạt động
        </Button>
      </div>

      <div className="mb-8" />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Lỗi: {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Đang tải...</div>
      ) : activities.length === 0 ? (
        <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 text-amber-50">
          <CardContent className="pt-6 text-center text-amber-100">
            Chưa có hoạt động nào. Hãy bấm "Thêm hoạt động".
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((ac) => (
            <Card key={ac.id} className="border-[#8b1c1f] bg-[#2a0006]/90 text-amber-50">
              <CardHeader className="bg-[#2a0006]/90 rounded-t-xl min-h-[200px] flex flex-col justify-between p-5 border-b border-[#8b1c1f]/40">
                <div className="space-y-3">
                  <CardTitle className="text-xl md:text-xl font-bold text-amber-200 line-clamp-2 leading-tight tracking-tight">
                    {ac.title}
                  </CardTitle>
                  {ac.description && (
                    <div className="max-h-32 min-h-32 overflow-y-auto rounded-md bg-black/20 p-2 text-sm leading-relaxed text-amber-100/80 scrollbar-thin scrollbar-thumb-amber-900/50 scrollbar-track-transparent">
                      {ac.description}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ac.status === "active"
                      ? "bg-green-900/30 text-green-400 border border-green-800/50"
                      : "bg-gray-800 text-gray-400 border border-gray-700"
                      }`}
                  >
                    {ac.status === "active" ? "Đang hoạt động" : "Ngừng hoạt động"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-amber-100/50 mb-1">Giá member</p>
                    <p className="font-bold text-lg text-amber-100">{formatVND(ac.price_member ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-amber-100/50 mb-1">Giá non-member</p>
                    <p className="font-bold text-lg text-amber-100">{formatVND(ac.price_non_member ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-amber-100/50 mb-1">Tổng đăng ký</p>
                    <p className="font-bold text-lg text-amber-100">
                      {ac.total_count ?? 0}
                      <span className="text-sm text-amber-100/50 font-normal ml-1">
                        / {ac.max_participants ?? "∞"}
                      </span>
                    </p>
                  </div>
                  {ac.start_date && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-amber-100/50 mb-1">THỜI GIAN</p>
                      <p className="font-medium text-amber-100">
                        {new Date(ac.start_date).toLocaleString("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 mb-4">
                  {ac.location && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-amber-100/50 mb-1">Địa điểm</p>
                      <p className="font-medium text-amber-100 line-clamp-3">{ac.location}</p>
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
                    className="text-red-400 hover:bg-red-900/20 hover:text-red-git add 300"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border-[#8b1c1f] bg-[#2a0006] text-amber-50">
            <CardHeader className="bg-[#2a0006]/90 border-b border-[#8b1c1f]/40 sticky top-0 z-10">
              <CardTitle className="text-2xl text-amber-200">
                {editing ? "Chỉnh sửa hoạt động" : "Thêm hoạt động mới"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-amber-100">
                        Tên hoạt động *
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ví dụ: Hội thảo kỹ năng mềm"
                        required
                        className="bg-[#1a0004] border-[#8b1c1f]/50 text-amber-50 placeholder:text-amber-100/30 focus-visible:ring-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-amber-100">
                        Trạng thái
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="flex h-10 w-full rounded-md px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-[#1a0004] border border-[#8b1c1f]/50 text-amber-50 focus-visible:ring-amber-500/50"
                      >
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Ngừng hoạt động</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-amber-100">Mô tả</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Mô tả chi tiết về hoạt động"
                        rows={3}
                        className="flex w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-[#1a0004] border-[#8b1c1f]/50 text-amber-50 placeholder:text-amber-100/30 focus-visible:ring-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-amber-100">Địa điểm</label>
                      <textarea
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="VD: Hội trường A, tầng 3"
                        rows={2}
                        className="flex w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-[#1a0004] border-[#8b1c1f]/50 text-amber-50 placeholder:text-amber-100/30 focus-visible:ring-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-amber-100">
                        Số người tham gia tối đa
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
                        className="bg-[#1a0004] border-[#8b1c1f]/50 text-amber-50 placeholder:text-amber-100/30 focus-visible:ring-amber-500/50"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-amber-100">Giá member</label>
                        <Input
                          type="number"
                          value={priceMember}
                          onChange={(e) =>
                            setPriceMember(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          placeholder="0"
                          required
                          className="bg-[#1a0004] border-[#8b1c1f]/50 text-amber-50 placeholder:text-amber-100/30 focus-visible:ring-amber-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-amber-100">
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
                          className="bg-[#1a0004] border-[#8b1c1f]/50 text-amber-50 placeholder:text-amber-100/30 focus-visible:ring-amber-500/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-amber-100">
                        Thời gian bắt đầu
                      </label>
                      <Input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-[#1a0004] border-[#8b1c1f]/50 text-amber-50 placeholder:text-amber-100/30 focus-visible:ring-amber-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-amber-100">
                        Thời gian kết thúc
                      </label>
                      <Input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-[#1a0004] border-[#8b1c1f]/50 text-amber-50 placeholder:text-amber-100/30 focus-visible:ring-amber-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-[#8b1c1f]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpenForm(false)
                      resetForm()
                    }}
                    className="border-[#8b1c1f] bg-transparent text-amber-100 hover:bg-[#8b1c1f]/20 hover:text-amber-50"
                  >
                    Hủy bỏ
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-900/20">
                    {editing ? "Cập nhật hoạt động" : "Tạo hoạt động mới"}
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

