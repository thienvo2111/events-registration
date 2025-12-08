// src/app/cart/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { formatVND } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, ArrowLeft, ShoppingCart } from "lucide-react"
import { createPaymentQuickLink } from "@/lib/qr-generator"
import { useRouter } from "next/navigation"


export default function CartPage() {
  const { state, updateQuantity, removeItem } = useCart()
  const { items, totalAmount, totalItems } = state
  const [note, setNote] = useState("")
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [creatingQR, setCreatingQR] = useState(false)
  const router = useRouter()


  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <h1 className="text-2xl font-bold text-slate-900">Giỏ hàng</h1>
            <Link href="/events">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Tiếp tục chọn hoạt động</span>
              </Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-16">
          <ShoppingCart className="mb-4 h-10 w-10 text-slate-400" />
          <p className="mb-4 text-lg font-semibold text-slate-800">
            Giỏ hàng trống
          </p>
          <Link href="/events">
            <Button>Tiếp tục chọn hoạt động</Button>
          </Link>
        </main>
      </div>
    )
  }

  const distinctActivities = items.length

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Giỏ hàng</h1>
          <Link href="/events">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Tiếp tục mua</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[2fr,1fr]">
        {/* Danh sách item */}
        <div className="space-y-4">
          {items.map((item, idx) => {
            const lineTotal = item.unitPrice * item.quantity

            return (
              <Card
                key={`${item.activityId}-${item.pricingType}-${idx}`}
                className="flex flex-col gap-4 border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Hình thức:{" "}
                      <span className="font-medium">
                        {item.pricingType === "member"
                          ? "Member"
                          : "Non‑member"}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => removeItem(item.activityId, item.pricingType)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  {/* Số lượng + nút +/- */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Số lượng</span>
                    <div className="inline-flex items-center rounded-lg border bg-slate-50">
                      <button
                        type="button"
                        className="px-3 py-1 text-lg"
                        onClick={() =>
                          updateQuantity(
                            item.activityId,
                            item.pricingType,
                            item.quantity - 1,
                          )
                        }
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        className="w-16 border-x bg-white p-1 text-center text-sm"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.activityId,
                            item.pricingType,
                            Number(e.target.value) || 1,
                          )
                        }
                      />
                      <button
                        type="button"
                        className="px-3 py-1 text-lg"
                        onClick={() =>
                          updateQuantity(
                            item.activityId,
                            item.pricingType,
                            item.quantity + 1,
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Giá & thành tiền */}
                  <div className="flex flex-col items-end gap-1 text-right">
                    <div className="text-xs text-slate-500">Giá/Đơn vị</div>
                    <div className="text-sm font-semibold">
                      {formatVND(item.unitPrice)}
                    </div>
                    <div className="text-xs text-slate-500">Thành tiền</div>
                    <div className="text-base font-bold text-blue-600">
                      {formatVND(lineTotal)}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Tóm tắt + thanh toán */}
        <Card className="space-y-4 border p-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Tóm tắt đơn hàng
          </h2>

          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Số lượng sản phẩm</span>
              <span className="font-medium">{totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span>Số hoạt động</span>
              <span className="font-medium">{distinctActivities}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between border-t pt-3">
            <span className="text-base font-semibold text-slate-900">
              Tổng cộng
            </span>
            <span className="text-xl font-bold text-blue-600">
              {formatVND(totalAmount)}
            </span>
          </div>
          <div>
            <Button
              className="w-full rounded-full bg-blue-600 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={items.length === 0}
              onClick={() => router.push("/checkout")}
            >
              Tiến hành thanh toán
            </Button>
          </div>
        </Card>
      </main>
    </div>
  )
}
