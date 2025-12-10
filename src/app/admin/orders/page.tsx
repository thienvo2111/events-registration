"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatVND } from "@/lib/format"

interface OrderDetail {
  id: string
  order_code: string
  payment_status: "pending" | "paid" | "cancelled"
  total_amount: number
  created_at: string
  registration?: {
    id: string
    full_name: string
    phone_number: string
    email?: string | null
    unit?: {
      name: string | null
    } | null
  } | null
  order_items?: Array<{
    id: string
    quantity: number
    price_per_unit: number
    subtotal: number
    pricing_type?: string | null
    activity?: {
      title: string
    } | null
  }>
}

export default function AdminOrdersPage() {
  const supabase = createSupabaseClient()
  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [filteredOrders, setFilteredOrders] = useState<OrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    const filtered = orders.filter(
      (order) =>
        order.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.registration?.full_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    )
    setFilteredOrders(filtered)
  }, [searchQuery, orders])

  async function loadOrders() {
    try {
      setLoading(true)
      setError("")

      const { data, error: err } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_code,
          payment_status,
          total_amount,
          created_at,
          registration:registrations(id, full_name, phone_number, email, unit:units(name)),
          order_items(id, quantity, price_per_unit, subtotal, pricing_type, activity:activities(title))
        `,
        )
        .order("created_at", { ascending: false })

      if (err) throw err

      const mappedOrders: OrderDetail[] = (data ?? []).map((order: any) => ({
        id: order.id,
        order_code: order.order_code,
        payment_status: order.payment_status,
        total_amount: order.total_amount,
        created_at: order.created_at,
        registration: Array.isArray(order.registration)
          ? order.registration[0] ?? null
          : order.registration,
        order_items: Array.isArray(order.order_items)
          ? order.order_items
          : order.order_items
          ? [order.order_items]
          : [],
      }))

      setOrders(mappedOrders)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }

  async function confirmPayment(orderId: string) {
    try {
      const { error: err } = await supabase
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("id", orderId)

      if (err) throw err

      setOrders(
        orders.map((o) =>
          o.id === orderId ? { ...o, payment_status: "paid" } : o,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi cập nhật trạng thái")
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-[#3b0008] px-4 py-10 text-amber-50 md:px-6">
        <div className="mx-auto max-w-6xl text-center text-sm text-amber-100">
          Đang tải dữ liệu đơn hàng...
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-[#3b0008] px-4 py-8 text-amber-50 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Quản lý đơn hàng
          </h1>
          <p className="mt-1 text-sm text-amber-100/85">
            Xem, tìm kiếm và xác nhận thanh toán cho các đơn hàng
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-3 text-sm text-red-200">
            Lỗi: {error}
          </div>
        )}

        <div>
          <Input
            placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md border-amber-200/60 bg-black/20 text-sm text-amber-50 placeholder:text-amber-200/60 focus:border-amber-300 focus:outline-none"
          />
        </div>

        {filteredOrders.length === 0 ? (
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90">
            <CardContent className="pt-6 text-center text-sm text-amber-100/80">
              Chưa có đơn hàng nào
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="border-[#8b1c1f]/50 bg-[#2a0006]/90 text-amber-50"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-amber-200">
                        Đơn #{order.order_code}
                      </CardTitle>
                      <p className="mt-1 text-xs text-amber-200/80">
                        {new Date(order.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.payment_status === "paid"
                          ? "bg-green-500/20 text-green-300"
                          : order.payment_status === "cancelled"
                          ? "bg-red-500/20 text-red-200"
                          : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {order.payment_status === "paid"
                        ? "Hoàn thành"
                        : order.payment_status === "cancelled"
                        ? "Hủy"
                        : "Chờ thanh toán"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div>
                      <p className="text-xs text-amber-200/80">Người đặt</p>
                      <p className="font-semibold">
                        {order.registration?.full_name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-200/80">SĐT / Email</p>
                      <p className="text-sm">
                        {order.registration?.phone_number}{" "}
                        {order.registration?.email && (
                          <>
                            {" / "}
                            {order.registration.email}
                          </>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-200/80">Đơn vị</p>
                      <p className="font-semibold">
                        {order.registration?.unit?.name || "Không có"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-200/80">Tổng tiền</p>
                      <p className="text-lg font-semibold text-amber-300">
                        {formatVND(order.total_amount)}
                      </p>
                    </div>
                  </div>

                  {order.order_items && order.order_items.length > 0 && (
                    <div className="mb-4 border-t border-[#8b1c1f]/40 pb-4 pt-3">
                      <p className="mb-2 text-sm font-semibold">
                        Chi tiết hoạt động:
                      </p>
                      <ul className="space-y-1 text-sm">
                        {order.order_items.map((item) => (
                          <li
                            key={item.id}
                            className="flex justify-between gap-2"
                          >
                            <span>
                              {item.activity?.title || "Hoạt động"} ×{" "}
                              {item.quantity}
                              {item.pricing_type && (
                                <span className="text-amber-200/80">
                                  {" "}
                                  ({item.pricing_type})
                                </span>
                              )}
                            </span>
                            <span>
                              {formatVND(item.price_per_unit * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {order.payment_status === "pending" && (
                    <Button
                      onClick={() => confirmPayment(order.id)}
                      className="bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
                    >
                      Xác nhận thanh toán
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
