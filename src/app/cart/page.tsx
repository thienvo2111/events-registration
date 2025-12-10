"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { formatVND } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, ArrowLeft, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const { state, updateQuantity, removeItem } = useCart()
  const { items, totalAmount, totalItems } = state
  const [note, setNote] = useState("")
  const router = useRouter()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#600202] px-4 py-10 text-amber-50 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <ShoppingCart className="mx-auto mb-4 h-10 w-10 text-amber-300" />
          <h1 className="text-xl font-semibold md:text-2xl">
            Bạn chưa chọn hoạt động nào.
          </h1>
          <p className="mt-2 text-sm text-amber-100/80">
            Hãy quay lại trang đăng ký để chọn hoạt động bạn muốn tham gia.
          </p>
          <Button
            onClick={() => router.push("/events")}
            className="mt-6 rounded-full bg-amber-400 px-6 py-2 text-sm font-semibold text-[#3b0008] hover:bg-amber-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại trang hoạt động
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#600202] px-4 py-8 text-amber-50 md:px-6 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Giỏ hàng
            </h1>
            <p className="mt-1 text-sm text-amber-100/85">
              Bạn đã chọn {totalItems} vé cho các hoạt động.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-full border-amber-200/60 bg-black/20 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-black/40 md:text-sm"
            onClick={() => router.push("/events")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tiếp tục chọn hoạt động
          </Button>
        </div>

        <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 text-amber-50">
          <div className="border-b border-[#8b1c1f]/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-amber-200/90 md:px-6 md:text-sm">
            Chi tiết giỏ hàng
          </div>
          <div className="divide-y divide-[#8b1c1f]/40">
            {items.map((item) => {
              const lineTotal = item.quantity * item.unitPrice
              return (
                <div
                  key={`${item.activityId}-${item.pricingType}`}
                  className="grid gap-3 px-4 py-3 text-xs md:grid-cols-6 md:items-center md:px-6 md:py-4 md:text-sm"
                >
                  <div className="md:col-span-2">
                    <p className="font-semibold text-amber-50">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[11px] text-amber-200/85 md:text-xs">
                      Hình thức:{" "}
                      {item.pricingType === "member"
                        ? "Member"
                        : "Non-member"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-amber-200/85 md:hidden">
                      Số lượng
                    </span>
                    <div className="inline-flex items-center rounded-full border border-amber-200/50 bg-black/20 px-2 py-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.activityId,
                            item.pricingType,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        className="px-2 text-amber-100 hover:text-amber-300"
                      >
                        −
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.activityId,
                            item.pricingType,
                            item.quantity + 1,
                          )
                        }
                        className="px-2 text-amber-100 hover:text-amber-300"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] text-amber-200/85 md:hidden">
                      Giá/Đơn vị
                    </p>
                    <p className="font-semibold text-amber-200">
                      {formatVND(item.unitPrice)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] text-amber-200/85 md:hidden">
                      Thành tiền
                    </p>
                    <p className="font-semibold text-amber-300">
                      {formatVND(lineTotal)}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(item.activityId, item.pricingType)}
                      className="inline-flex items-center gap-1 rounded-full border border-red-500/60 bg-red-900/40 px-3 py-1 text-xs font-semibold text-red-200 hover:bg-red-900/70"
                    >
                      <Trash2 className="h-3 w-3" />
                      Xóa
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 text-amber-50">
            <div className="px-4 py-3 text-sm font-semibold text-amber-200 md:px-6">
              Tổng thanh toán
            </div>
            <div className="space-y-3 px-4 py-3 text-sm md:px-6">
              <div className="flex items-center justify-between">
                <span className="text-amber-100/80">Tổng số vé</span>
                <span className="font-semibold text-amber-200">
                  {totalItems}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-100/80">Tạm tính</span>
                <span className="text-base font-bold text-amber-300">
                  {formatVND(totalAmount)}
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                Phí thanh toán (nếu có) sẽ được hiển thị ở bước xác nhận.
              </p>
              <Button
                className="mt-1 w-full rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-[#3b0008] hover:bg-amber-300"
                onClick={() => router.push("/checkout")}
              >
                Tiến hành thanh toán
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
