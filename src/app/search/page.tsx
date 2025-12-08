"use client"

import { useState } from "react"
import { createSupabaseClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatVND } from "@/lib/format"

interface OrderResult {
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

export default function SearchPage() {
  const supabase = createSupabaseClient()

  const [searchType, setSearchType] = useState<"order_code" | "phone_number">(
    "order_code"
  )
  const [searchValue, setSearchValue] = useState("")
  const [results, setResults] = useState<OrderResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setResults([])
    setHasSearched(true)

    if (!searchValue.trim()) {
      setError("Vui lòng nhập thông tin tìm kiếm")
      return
    }

    try {
      setLoading(true)

      let query = supabase.from("orders").select(
        `
        id,
        order_code,
        payment_status,
        total_amount,
        created_at,
        registration:registrations(id, full_name, phone_number, email),
        order_items(id, quantity, price_per_unit, subtotal, pricing_type, activity:activities(title))
      `
      )

      if (searchType === "order_code") {
        query = query.ilike("order_code", `%${searchValue}%`)
      } else {
        query = query.eq("registration.phone_number", searchValue)
      }

      const { data, error: err } = await query.order("created_at", {
        ascending: false,
      })

      if (err) {
        throw err
      }

      // FIX: Map data to handle array relationships from Supabase
      const mappedResults: OrderResult[] = (data ?? []).map((order: any) => ({
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

      setResults(mappedResults)

      if (mappedResults.length === 0) {
        setError(
          `Không tìm thấy đơn hàng với ${
            searchType === "order_code" ? "mã đơn này" : "số điện thoại này"
          }. Vui lòng kiểm tra lại thông tin và thử lại.`
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Lỗi khi tìm kiếm đơn hàng. Vui lòng thử lại."
      )
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("vi-VN")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Tìm đơn hàng của bạn</h1>
          <p className="text-gray-600">
            Tìm thông tin đơn hàng của bạn bằng mã đơn hoặc số điện thoại
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Search Type Toggle */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="searchType"
                    value="order_code"
                    checked={searchType === "order_code"}
                    onChange={(e) =>
                      setSearchType(e.target.value as "order_code" | "phone_number")
                    }
                    className="cursor-pointer"
                  />
                  <span>Tìm theo mã đơn</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="searchType"
                    value="phone_number"
                    checked={searchType === "phone_number"}
                    onChange={(e) =>
                      setSearchType(e.target.value as "order_code" | "phone_number")
                    }
                    className="cursor-pointer"
                  />
                  <span>Tìm theo số điện thoại</span>
                </label>
              </div>

              {/* Search Input */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={
                    searchType === "order_code"
                      ? "Nhập mã đơn hàng..."
                      : "Nhập số điện thoại..."
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Đang tìm..." : "Tìm kiếm"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {hasSearched && !loading && results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tìm thấy {results.length} đơn hàng
            </p>

            {results.map((order) => {
              const reg = order.registration
              const itemCount = order.order_items?.length ?? 0

              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Mã đơn hàng: {order.order_code}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(order.created_at)}
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
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b">
                      <div>
                        <p className="text-sm text-gray-600">Tên:</p>
                        <p className="font-medium">
                          {reg?.full_name || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Số điện thoại:</p>
                        <p className="font-medium">
                          {reg?.phone_number || "—"}
                        </p>
                      </div>
                      {reg?.email && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600">Email:</p>
                          <p className="font-medium">{reg.email}</p>
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="mb-4 pb-4 border-b">
                        <p className="text-sm font-semibold mb-2">
                          Danh sách hoạt động ({itemCount}):
                        </p>
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
                              <span className="font-medium">
                                {formatVND(item.subtotal)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Tổng tiền:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatVND(order.total_amount)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Help Section */}
        {!hasSearched && (
          <Card>
            <CardHeader>
              <CardTitle>Cần trợ giúp?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Không tìm thấy đơn hàng:</strong> kiểm tra lại mã đơn
                hoặc số điện thoại bạn nhập.
              </p>
              <p>
                <strong>Quên mã đơn hàng:</strong> hãy sử dụng số điện thoại đã
                đăng ký để tra cứu.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
