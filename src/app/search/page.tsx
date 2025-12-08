"use client"

import React, { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatVND, formatDate } from "@/lib/utils"

type SearchType = "order_code" | "phone_number"

type OrderItem = {
  id: string
  quantity: number
  price_per_unit: number
  subtotal: number
  pricing_type: string | null
  activity: {
    id: string
    title: string
  } | null
}

type OrderResult = {
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
  } | null
  order_items: OrderItem[]
}

export default function SearchPage() {
  const [searchType, setSearchType] = useState<SearchType>("order_code")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<OrderResult[]>([])
  const [openId, setOpenId] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResults([])

    if (!query.trim()) {
      setError("Vui lòng nhập thông tin cần tra cứu.")
      return
    }

    setLoading(true)

    try {
      // select từ orders + join registrations + order_items + activities
      let q = supabase
        .from("orders")
        .select(
          `
          id,
          order_code,
          payment_status,
          total_amount,
          created_at,
          registration:registrations (
            id,
            full_name,
            phone_number,
            email
          ),
          order_items (
            id,
            quantity,
            price_per_unit,
            subtotal,
            pricing_type,
            activity:activities (
              id,
              title
            )
          )
        `,
        )

      if (searchType === "order_code") {
        q = q.eq("order_code", query.trim())
      } else {
        // lọc theo phone_number của registrations
        q = q.eq("registration.phone_number", query.trim())
      }

      const { data, error } = await q

      if (error) {
        console.error("SEARCH ERROR message:", error.message)
        console.error("SEARCH ERROR details:", error.details)
        console.error("SEARCH ERROR hint:", error.hint)
        throw error
      }

      setResults((data as OrderResult[]) || [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tra cứu đơn hàng, vui lòng thử lại.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Link href="/events">
              <Button variant="ghost">⬅ Quay lại</Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">
              Tra cứu đơn hàng
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Form tra cứu */}
        <Card className="mb-6 p-6">
          <p className="mb-4 text-sm text-slate-600">
            Tìm thông tin đơn hàng của bạn bằng mã đơn hoặc số điện thoại
          </p>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="order_code"
                  checked={searchType === "order_code"}
                  onChange={() => setSearchType("order_code")}
                />
                <span>Mã đơn hàng</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="phone_number"
                  checked={searchType === "phone_number"}
                  onChange={() => setSearchType("phone_number")}
                />
                <span>Số điện thoại</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder={
                  searchType === "order_code"
                    ? "Nhập mã đơn hàng (ví dụ: ORD202512086302)"
                    : "Nhập số điện thoại đã đăng ký"
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Đang tìm..." : "Tìm kiếm"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Thông báo lỗi */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <p>
              Không tìm thấy đơn hàng với{" "}
              {searchType === "order_code" ? "mã đơn này" : "số điện thoại này"}
              .
            </p>
            <p>Vui lòng kiểm tra lại thông tin và thử lại.</p>
          </Card>
        )}

        {/* Kết quả */}
        {results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Tìm thấy {results.length} đơn hàng
            </p>

            {results.map((order) => {
              const reg = order.registration
              const itemCount = order.order_items.length

              return (
                <Card
                  key={order.id}
                  className="flex flex-col gap-4 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Mã đơn hàng
                      </p>
                      <p className="font-mono text-lg font-bold text-slate-900">
                        {order.order_code}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.payment_status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : order.payment_status === "cancelled"
                          ? "bg-red-50 text-red-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {order.payment_status === "completed"
                        ? "✓ Đã thanh toán"
                        : order.payment_status === "cancelled"
                        ? "✗ Đã hủy"
                        : "⏳ Chờ thanh toán"}
                    </div>
                  </div>

                  <div className="grid gap-4 text-sm md:grid-cols-2">
                    <div className="space-y-1">
                      <p>
                        <span className="font-semibold">Tên: </span>
                        {reg?.full_name}
                      </p>
                      <p>
                        <span className="font-semibold">
                          Số điện thoại:{" "}
                        </span>
                        {reg?.phone_number}
                      </p>
                      {reg?.email && (
                        <p>
                          <span className="font-semibold">Email: </span>
                          {reg.email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                    <p>
                      <span className="font-semibold">Tổng tiền: </span>
                      {formatVND(order.total_amount)}
                    </p>
                    <p>
                      <span className="font-semibold">Ngày đặt: </span>
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  </div>
                  {/* Nút chi tiết đơn hàng */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setOpenId(openId === order.id ? null : order.id)}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      <span>Chi tiết đơn hàng ({itemCount})</span>
                      <span className="text-slate-400">
                        {openId === order.id ? "Ẩn" : "Xem"}
                      </span>
                    </button>

                    {openId === order.id && order.order_items.length > 0 && (
                      <div className="mt-2 rounded-md bg-slate-50 p-3 text-xs">
                        {order.order_items.map((it) => (
                          <div key={it.id} className="flex justify-between py-1">
                            <span>
                              {it.activity?.title ?? "Hoạt động"} x {it.quantity}
                              {it.pricing_type && ` (${it.pricing_type})`}
                            </span>
                            <span>
                              {formatVND(it.price_per_unit * it.quantity)}
                            </span>
                          </div>
                        ))}
                        <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                          <span>Tổng cộng</span>
                          <span>{formatVND(order.total_amount)}</span>
                        </div>
                      </div>
                    )}
                  </div>


                  <Card className="mt-2 border-blue-100 bg-blue-50 p-3 text-xs text-slate-700">
                    💡 Vui lòng chuyển khoản theo mã QR trong màn hình xác
                    nhận đơn hàng hoặc email. Trạng thái sẽ được cập nhật
                    sau khi thanh toán.
                  </Card>
                </Card>
              )
            })}
          </div>
        )}

        {/* Gợi ý mặc định */}
        {!error && !loading && results.length === 0 && (
          <Card className="mt-6 border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            <p className="mb-2 font-semibold">Cần trợ giúp?</p>
            <p>
              Không tìm thấy đơn hàng: kiểm tra lại mã đơn hoặc số điện thoại
              bạn nhập.
            </p>
            <p className="mt-1">
              Quên mã đơn hàng: hãy sử dụng số điện thoại đã đăng ký để tra cứu.
            </p>
          </Card>
        )}
      </main>
    </div>
  )
}
