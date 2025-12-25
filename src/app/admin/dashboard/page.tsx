"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatVND } from "@/lib/format"
import type { DashboardOrder, DashboardMetrics } from "@/lib/types"

// Định nghĩa cấu hình hiển thị trạng thái
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  paid: {
    label: "Hoàn thành",
    className: "bg-green-500/20 text-green-300",
  },
  pending: {
    label: "Chưa thanh toán",
    className: "bg-yellow-500/20 text-yellow-300",
  },
  cancelled: {
    label: "Hủy",
    className: "bg-red-500/20 text-red-300",
  },
}

export default function AdminDashboardPage() {
  const supabase = createSupabaseClient()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      setLoading(true)

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_code,
          total_amount,
          payment_status,
          created_at,
          registration:registrations(id,full_name,spec_req,note)
        `,
        )
        .order("created_at", { ascending: false })

      if (ordersError) throw ordersError

      const totalOrders = orders?.length ?? 0
      const pendingOrders =
        orders?.filter((o: any) => o.payment_status === "pending")?.length ?? 0
      const cancelledOrders =
        orders?.filter((o: any) => o.payment_status === "cancelled")?.length ?? 0

      const recentOrders: DashboardOrder[] = (orders ?? [])
        .slice(0, 400)
        .map((order: any) => ({
          id: order.id,
          order_code: order.order_code,
          total_amount: order.total_amount,
          payment_status: order.payment_status,
          created_at: order.created_at,
          registration: order.registration ?? null,
        }))

      setMetrics({
        totalOrders,
        pendingOrders,
        cancelledOrders,
        recentOrders,
      })
    } catch (error) {
      console.error("Failed to load dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#3b0008] px-4 py-10 text-amber-50 md:px-6">
        <div className="mx-auto max-w-6xl text-center text-sm text-amber-100">
          Đang tải dữ liệu dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#3b0008] px-4 py-8 text-amber-50 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Dashboard Quản Lý
          </h1>
          <p className="mt-1 text-sm text-amber-100/85">
            Thống kê tổng quan về đặt hàng và tham gia hoạt động.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Tổng đơn hàng" value={metrics?.totalOrders ?? 0} />
          <StatCard
            label="Đơn chờ thanh toán"
            value={metrics?.pendingOrders ?? 0}
          />
          <StatCard
            label="Đơn hoàn thành"
            value={(metrics?.totalOrders ?? 0) - (metrics?.pendingOrders ?? 0) - (metrics?.cancelledOrders ?? 0)}
          />
          <StatCard
            label="Đơn đã hủy"
            value={metrics?.cancelledOrders ?? 0}
          />
        </div>

        <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 text-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-200">
              Đơn hàng gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!metrics?.recentOrders || metrics.recentOrders.length === 0 ? (
              <p className="text-sm text-amber-100/80">
                Chưa có đơn hàng nào.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-[#8b1c1f]/40 bg-black/20 text-amber-200">
                      <th className="px-3 py-2 font-semibold">Mã đơn</th>
                      <th className="px-3 py-2 font-semibold">Người đặt</th>
                      <th className="px-3 py-2 font-semibold text-right">
                        Tổng tiền
                      </th>
                      <th className="px-3 py-2 font-semibold text-center">
                        Trạng thái
                      </th>
                      <th className="px-3 py-2 font-semibold">Yêu cầu đặc biệt</th>
                      <th className="px-3 py-2 font-semibold">Ngày tạo</th>
                      <th className="px-3 py-2 font-semibold">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recentOrders.map((order) => {
                      // Lấy config hiển thị dựa trên trạng thái, fallback về pending nếu không khớp
                      const statusInfo = STATUS_CONFIG[order.payment_status] || STATUS_CONFIG.pending;

                      return (
                        <tr
                          key={order.id}
                          className="border-b border-[#8b1c1f]/30 last:border-0"
                        >
                          <td className="px-3 py-2 font-mono">
                            {order.order_code}
                          </td>
                          <td className="px-3 py-2">
                            {order.registration?.full_name ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatVND(order.total_amount || 0)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}
                            >
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {order.registration?.spec_req ?? "—"}
                          </td>
                          <td className="px-3 py-2">
                            {new Date(order.created_at).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-3 py-2">
                            {order.registration?.note ?? "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 text-amber-50">
      <CardContent className="pt-4">
        <p className="mb-1 text-xs text-amber-200/80">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}