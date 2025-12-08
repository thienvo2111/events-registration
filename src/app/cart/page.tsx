// src/app/cart/page.tsx

"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { formatVND } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Trash2, ArrowLeft, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const { state, updateQuantity, removeItem } = useCart()
  const { items, totalAmount, totalItems } = state
  const [note, setNote] = useState("")
  const router = useRouter()

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 text-center">
          <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Giỏ hàng trống</h1>
          <p className="text-gray-600 mb-6">
            Bạn chưa chọn hoạt động nào. Hãy quay lại để chọn.
          </p>
          <Link href="/">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tiếp tục chọn hoạt động
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const distinctActivities = items.length

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Giỏ hàng của bạn</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Danh sách item */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const lineTotal = item.unitPrice * item.quantity
              return (
                <Card key={`${item.activityId}-${item.pricingType}`} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {/* Thông tin hoạt động */}
                    <div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-sm text-gray-600">
                        Hình thức:{" "}
                        <span className="font-medium">
                          {item.pricingType === "member"
                            ? "Member"
                            : "Non-member"}
                        </span>
                      </p>
                    </div>

                    {/* Số lượng */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Số lượng</p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(
                              item.activityId,
                              item.pricingType,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                        >
                          −
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.activityId,
                              item.pricingType,
                              Number(e.target.value) || 1
                            )
                          }
                          className="w-12 text-center"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(
                              item.activityId,
                              item.pricingType,
                              item.quantity + 1
                            )
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Giá */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Giá/Đơn vị</p>
                      <p className="font-semibold">{formatVND(item.unitPrice)}</p>
                      <p className="text-xs text-gray-500 mt-2 mb-1">Thành tiền</p>
                      <p className="font-bold text-blue-600">
                        {formatVND(lineTotal)}
                      </p>
                    </div>

                    {/* Nút xóa */}
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() =>
                          removeItem(item.activityId, item.pricingType)
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Tóm tắt đơn hàng */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>

              <div className="space-y-3 mb-6 pb-4 border-b">
                <div className="flex justify-between">
                  <span className="text-gray-600">Số lượng sản phẩm</span>
                  <span className="font-semibold">{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số hoạt động</span>
                  <span className="font-semibold">{distinctActivities}</span>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Tổng cộng</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatVND(totalAmount)}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => router.push("/checkout")}
                className="w-full bg-blue-600 hover:bg-blue-700 mb-3"
              >
                Tiến hành thanh toán
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/")}
              >
                Tiếp tục mua sắm
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
