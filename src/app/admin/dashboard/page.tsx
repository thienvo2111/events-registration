"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatVND } from "@/lib/format"
import type { DashboardOrder, DashboardMetrics } from "@/lib/types"

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

      // Fetch orders with registrations
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_code,
          total_amount,
          payment_status,
          created_at,
          registration:registrations(full_name)
        `
        )
        .order("created_at", { ascending: false })

      if (ordersError) throw ordersError

      const totalOrders = orders?.length ?? 0
      const pendingOrders =
        orders?.filter((o: any) => o.payment_status === "pending")?.length ?? 0

      // FIX: Map orders to DashboardOrder[] with proper type
      const recentOrders: DashboardOrder[] = (orders ?? [])
        .slice(0, 5)
        .map((order: any) => ({
          id: order.id,
          order_code: order.order_code,
          total_amount: order.total_amount,
          payment_status: order.payment_status,
          created_at: order.created_at,
          registration: Array.isArray(order.registration)
            ? order.registration[0] ?? null
            : order.registration,
        }))

      setMetrics({
        totalOrders,
        pendingOrders,
        recentOrders,
      })
    } catch (error) {
      console.error("Failed to load dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Đang tải...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Quản Lý</h1>
      <p className="text-gray-600">
        Thống kê tổng quan về đặt hàng và tham gia hoạt động.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Tổng đơn hàng" value={metrics?.totalOrders ?? 0} />
        <StatCard label="Đơn chờ thanh toán" value={metrics?.pendingOrders ?? 0} />
        <StatCard
          label="Đơn hoàn thành"
          value={(metrics?.totalOrders ?? 0) - (metrics?.pendingOrders ?? 0)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Đơn hàng gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {!metrics?.recentOrders || metrics.recentOrders.length === 0 ? (
            <p className="text-gray-500">Chưa có đơn hàng nào.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Mã đơn</th>
                  <th className="text-left py-2">Người đặt</th>
                  <th className="text-right py-2">Tổng tiền</th>
                  <th className="text-center py-2">Trạng thái</th>
                  <th className="text-left py-2">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{order.order_code}</td>
                    <td className="py-2">{order.registration?.full_name ?? "—"}</td>
                    <td className="py-2 text-right">
                      {formatVND(order.total_amount || 0)}
                    </td>
                    <td className="py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.payment_status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.payment_status === "completed"
                          ? "Hoàn thành"
                          : "Chờ"}
                      </span>
                    </td>
                    <td className="py-2">
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-gray-600 text-sm mb-2">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
