'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatVND } from '@/lib/format'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface OrderItem {
  id: string
  quantity: number
  price_per_unit: number
  subtotal: number
  pricing_type: string | null
  activity: { id: string; title: string } | null
}

interface Order {
  id: string
  order_code: string
  payment_status: string
  total_amount: number
  created_at: string
  registration: {
    id: string
    full_name: string
    phone_number: string
    email: string | null
    unit: { name: string | null } | null
  } | null
  order_items: OrderItem[]
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchQuery, filterStatus])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('orders')
        .select(`
          id,
          order_code,
          payment_status,
          total_amount,
          created_at,
          registration:registrations (
            id,
            full_name,
            phone_number,
            email,
            unit:units ( name )
          ),
          order_items (
            id,
            quantity,
            price_per_unit,
            subtotal,
            pricing_type,
            activity:activities ( id, title )
          )
        `)
        .order('created_at', { ascending: false })

      if (err) throw err
      setOrders(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((o) => o.payment_status === filterStatus)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (o) =>
          o.order_code.toLowerCase().includes(query) ||
          o.registration?.full_name.toLowerCase().includes(query) ||
          o.registration?.phone_number.includes(query)
      )
    }

    setFilteredOrders(filtered)
  }

  const handleConfirmPayment = async (orderId: string) => {
    if (!confirm('Xác nhận đơn hàng này đã thanh toán?')) return

    try {
      const { error: err } = await supabase
        .from('orders')
        .update({ payment_status: 'completed' })
        .eq('id', orderId)

      if (err) throw err
      await fetchOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi cập nhật đơn hàng')
    }
  }

  const handleMarkFailed = async (orderId: string) => {
    if (!confirm('Đánh dấu đơn hàng này là thất bại?')) return

    try {
      const { error: err } = await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', orderId)

      if (err) throw err
      await fetchOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi cập nhật đơn hàng')
    }
  }

  if (loading) {
    return <div className="text-center text-slate-600">Đang tải...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Quản lý đơn hàng
        </h1>
        <p className="mt-2 text-slate-600">
          Xem, tìm kiếm và xác nhận thanh toán cho các đơn hàng
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div>
            <label className="form-label">Tìm kiếm</label>
            <Input
              placeholder="Mã đơn, tên, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Trạng thái</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-control"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="completed">Hoàn tất</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="p-6 text-center text-slate-600">
            Không tìm thấy đơn hàng nào
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id}>
              <div className="border-b border-slate-200 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Mã đơn</p>
                    <p className="font-mono text-lg font-semibold text-slate-900">
                      {order.order_code}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Tổng tiền</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatVND(order.total_amount)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3 text-sm">
                  <div>
                    <p className="text-slate-600">Người đặt</p>
                    <p className="font-medium text-slate-900">
                      {order.registration?.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">SĐT / Email</p>
                    <p className="font-medium text-slate-900">
                      {order.registration?.phone_number}
                      {order.registration?.email && (
                        <>
                          {' / '}
                          {order.registration.email}
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Đơn vị</p>
                    <p className="font-medium text-slate-900">
                      {order.registration?.unit?.name || 'Không có'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.payment_status} />
                    <span className="text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedOrderId(
                        expandedOrderId === order.id ? null : order.id
                      )
                    }
                    className="flex w-full sm:w-auto items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <span>Chi tiết đơn hàng ({order.order_items.length})</span>
                    <span className="text-slate-400">
                      {expandedOrderId === order.id ? '▲' : '▼'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Order Items Expanded */}
              {expandedOrderId === order.id && (
                <div className="border-b border-slate-200 bg-slate-50 p-6">
                  <div className="space-y-2 text-xs">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between py-2">
                        <div className="text-slate-600">
                          <p>
                            {item.activity?.title || 'Hoạt động'} × {item.quantity}
                          </p>
                          {item.pricing_type && (
                            <p className="text-slate-400">
                              ({item.pricing_type})
                            </p>
                          )}
                        </div>
                        <p className="font-semibold text-slate-900">
                          {formatVND(item.price_per_unit * item.quantity)}
                        </p>
                      </div>
                    ))}
                    <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-semibold text-slate-900">
                      <span>Tổng cộng</span>
                      <span>{formatVND(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {order.payment_status === 'pending' && (
                <div className="flex gap-2 p-6">
                  <Button
                    onClick={() => handleConfirmPayment(order.id)}
                    variant="primary"
                    className="flex-1"
                  >
                    ✅ Xác nhận thanh toán
                  </Button>
                  <Button
                    onClick={() => handleMarkFailed(order.id)}
                    variant="outline"
                    className="flex-1 text-red-600"
                  >
                    ❌ Đánh dấu thất bại
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    completed: 'bg-green-50 text-green-700 border border-green-200',
    failed: 'bg-red-50 text-red-700 border border-red-200',
  }

  const labels: Record<string, string> = {
    pending: 'Chờ thanh toán',
    completed: 'Hoàn tất',
    failed: 'Thất bại',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || styles.pending
      }`}
    >
      {labels[status] || status}
    </span>
  )
}
