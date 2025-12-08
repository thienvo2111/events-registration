"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatVND } from "@/lib/format"
import { createSupabaseClient } from "@/utils/supabase/client"


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type DashboardOrder = {
  id: string
  order_code: string
  total_amount: number
  payment_status: string
  created_at: string
  registration: {
    full_name: string
  } | null
}

type DashboardMetrics = {
  totalOrders: number
  totalRevenue: number
  pendingPayments: number
  totalActivities: number
  totalAttendees: number
  recentOrders: DashboardOrder[]
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        setError(null)

        // Orders + registration
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select(
            `
            id,
            order_code,
            total_amount,
            payment_status,
            created_at,
            registration:registrations (
              full_name
            )
          `
          )
          .order("created_at", { ascending: false })

        if (ordersError) throw ordersError

        // Activities count
        const { data: activities, error: activitiesError } = await supabase
          .from("activities")
          .select("id")

        if (activitiesError) throw activitiesError

        // Attendees count
        const { data: attendees, error: attendeesError } = await supabase
          .from("attendees")
          .select("id")

        if (attendeesError) throw attendeesError

        const totalOrders = orders?.length ?? 0
        const totalRevenue =
          orders?.reduce(
            (sum, o) => sum + (typeof o.total_amount === "number" ? o.total_amount : 0),
            0
          ) ?? 0
        const pendingPayments =
          orders?.filter((o) => o.payment_status === "pending").length ?? 0

        const recentOrders = (orders ?? []).slice(0, 5) as DashboardOrder[]

        setMetrics({
          totalOrders,
          totalRevenue,
          pendingPayments,
          totalActivities: activities?.length ?? 0,
          totalAttendees: attendees?.length ?? 0,
          recentOrders,
        })
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu")
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) {
    return <div className="text-center text-sm text-slate-500">Đang tải...</div>
  }

  if (error || !metrics) {
    return (
      <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
        Lỗi: {error ?? "Không thể tải dữ liệu"}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Thống kê tổng quan về đặt hàng và tham gia hoạt động.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Tổng đơn hàng" value={metrics.totalOrders.toString()} icon="📦" />
        <MetricCard label="Doanh thu" value={formatVND(metrics.totalRevenue)} icon="💰" />
        <MetricCard
          label="Đơn chờ thanh toán"
          value={metrics.pendingPayments.toString()}
          icon="⏳"
        />
        <MetricCard
          label="Số hoạt động"
          value={metrics.totalActivities.toString()}
          icon="🎯"
        />
        <MetricCard
          label="Người tham gia"
          value={metrics.totalAttendees.toString()}
          icon="👥"
        />
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle>Đơn hàng gần đây</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {metrics.recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có đơn hàng nào.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Mã đơn</th>
                  <th className="px-4 py-2 text-left font-medium">Người đặt</th>
                  <th className="px-4 py-2 text-left font-medium">Tổng tiền</th>
                  <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                  <th className="px-4 py-2 text-left font-medium">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {metrics.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-xs font-semibold text-slate-900">
                      {order.order_code}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {order.registration?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-2 font-semibold text-slate-900">
                      {formatVND(order.total_amount || 0)}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={order.payment_status} />
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard(props: { label: string; value: string; icon?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {props.label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</p>
        </div>
        {props.icon && <span className="text-2xl">{props.icon}</span>}
      </div>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; className: string }
  > = {
    pending: {
      label: "Chờ thanh toán",
      className: "bg-amber-50 text-amber-700 ring-amber-100",
    },
    completed: {
      label: "Hoàn tất",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    },
    failed: {
      label: "Thất bại",
      className: "bg-red-50 text-red-700 ring-red-100",
    },
  }

  const cfg = map[status] ?? {
    label: status,
    className: "bg-slate-50 text-slate-700 ring-slate-100",
  }

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        cfg.className,
      ].join(" ")}
    >
      {cfg.label}
    </span>
  )
}
