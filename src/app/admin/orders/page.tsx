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
  payment_status: "pending" | "completed" | "cancelled"
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
          .includes(searchQuery.toLowerCase())
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
        `
        )
        .order("created_at", { ascending: false })

      if (err) throw err

      // FIX: Map data to OrderDetail[] - handle array registration
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
        .update({ payment_status: "completed" })
        .eq("id", orderId)

      if (err) throw err

      setOrders(
        orders.map((o) =>
          o.id === orderId ? { ...o, payment_status: "completed" } : o
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi cập nhật trạng thái")
    }
  }

  if (loading) return <div className="p-4">Đang tải...</div>

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold">Quản lý đơn hàng</h1>
        <p className="text-gray-600">
          Xem, tìm kiếm và xác nhận thanh toán cho các đơn hàng
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Lỗi: {error}
        </div>
      )}

      <div>
        <Input
          placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Chưa có đơn hàng nào
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Đơn #{order.order_code}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      order.payment_status === "completed"
                        ? "bg-green-100 text-green-800"
                        : order.payment_status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.payment_status === "completed"
                      ? "Hoàn thành"
                      : order.payment_status === "cancelled"
                      ? "Hủy"
                      : "Chờ thanh toán"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Người đặt</p>
                    <p className="font-semibold">
                      {order.registration?.full_name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">SĐT / Email</p>
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
                    <p className="text-xs text-gray-500">Đơn vị</p>
                    <p className="font-semibold">
                      {order.registration?.unit?.name || "Không có"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tổng tiền</p>
                    <p className="font-semibold text-lg">
                      {formatVND(order.total_amount)}
                    </p>
                  </div>
                </div>

                {order.order_items && order.order_items.length > 0 && (
                  <div className="mb-4 pb-4 border-t">
                    <p className="text-sm font-semibold mb-2">Chi tiết hoạt động:</p>
                    <ul className="space-y-1 text-sm">
                      {order.order_items.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span>
                            {item.activity?.title || "Hoạt động"} × {item.quantity}
                            {item.pricing_type && (
                              <span className="text-gray-500">
                                ({item.pricing_type})
                              </span>
                            )}
                          </span>
                          <span>{formatVND(item.price_per_unit * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {order.payment_status === "pending" && (
                  <Button
                    onClick={() => confirmPayment(order.id)}
                    className="bg-green-600 hover:bg-green-700"
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
  )
}
