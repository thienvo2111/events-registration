"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { formatVND } from "@/lib/utils"
import type { Activity, PricingType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/CartContext"

type QuantityMap = Record<string, number>
type PricingMap = Record<string, PricingType>

export default function EventsPage() {
  const { addItem, state, showToast } = useCart()
  const totalItemsInCart = state.totalItems

  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // trạng thái local cho từng activity: số lượng + loại giá
  const [quantities, setQuantities] = useState<QuantityMap>({})
  const [pricingTypes, setPricingTypes] = useState<PricingMap>({})

  useEffect(() => {
    async function loadActivities() {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("activities")
        .select("*")

      if (error) {
        console.error(error)
        setError(error.message)
        setActivities([])
      } else {
        const acts = (data as Activity[]) ?? []
        setActivities(acts)

        const q: QuantityMap = {}
        const p: PricingMap = {}

        acts.forEach((a) => {
          q[a.id] = 1
          p[a.id] = "non_member"
        })

        setQuantities(q)
        setPricingTypes(p)
      }

      setLoading(false)
    }

    loadActivities()
  }, [])

  // lấy số lượng trong giỏ cho 1 activity + pricingType
  const getCartQuantityFor = (
    activityId: string,
    pricingType: PricingType,
  ) => {
    const item = state.items.find(
      (i) =>
        i.activityId === activityId && i.pricingType === pricingType,
    )
    return item ? item.quantity : 0
  }

  const handleAddToCart = (activity: Activity) => {
    const pricingType: PricingType =
      pricingTypes[activity.id] ?? "non_member"
    const quantity = quantities[activity.id] ?? 1

    const unitPrice =
      pricingType === "member"
        ? activity.price_member ?? 0
        : activity.price_non_member ?? 0

    addItem({
      activityId: activity.id,
      title: activity.title,
      quantity,
      unitPrice,
      pricingType,
    })

    showToast(`Đã thêm ${quantity} x ${activity.title} vào giỏ hàng`)
  }

  const handleChangeQuantity = (id: string, q: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, q),
    }))
  }

  // khi đổi member / non-member: nếu chưa có trong giỏ → 1, nếu đã có → số lượng trong giỏ
  const handleChangePricing = (id: string, type: PricingType) => {
    setPricingTypes((prev) => ({
      ...prev,
      [id]: type,
    }))

    const inCartQty = getCartQuantityFor(id, type)

    setQuantities((prev) => ({
      ...prev,
      [id]: inCartQty > 0 ? inCartQty : 1,
    }))
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Danh sách hoạt động
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Vui lòng chọn số lượng và loại hình (Member/Non‑member)
            </p>
          </div>
          <Link href="/cart">
            <Button
              variant="outline"
              size="sm"
              className="relative flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Giỏ hàng</span>
              {totalItemsInCart > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5">
                  {totalItemsInCart}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">
            Tổng: {activities.length} hoạt động
          </p>
        </div>

        {loading && (
          <p className="text-sm text-gray-600">
            Đang tải danh sách hoạt động...
          </p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-600">
            Lỗi khi tải dữ liệu: {error}
          </p>
        )}

        {!loading && !error && activities.length === 0 && (
          <p className="text-sm text-gray-600">
            Không có hoạt động nào
          </p>
        )}

        {!loading && !error && activities.length > 0 && (
          <div className="space-y-4">
            {activities.map((activity) => {
              const pricingType: PricingType =
                pricingTypes[activity.id] ?? "non_member"
              const quantity = quantities[activity.id] ?? 1

              const memberPrice = activity.price_member ?? 0
              const nonMemberPrice = activity.price_non_member ?? 0

              const unitPrice =
                pricingType === "member"
                  ? memberPrice
                  : nonMemberPrice

              return (
                <div
                  key={activity.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3"
                >
                  <div className="flex justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">
                        {activity.title}
                      </h2>
                      {activity.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Chọn loại giá */}
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Hình thức:
                    </p>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`pricing-${activity.id}`}
                          checked={pricingType === "non_member"}
                          onChange={() =>
                            handleChangePricing(
                              activity.id,
                              "non_member",
                            )
                          }
                        />
                        <span className="text-sm text-gray-700">
                          Non‑member ({formatVND(nonMemberPrice)})
                        </span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`pricing-${activity.id}`}
                          checked={pricingType === "member"}
                          onChange={() =>
                            handleChangePricing(
                              activity.id,
                              "member",
                            )
                          }
                        />
                        <span className="text-sm text-gray-700">
                          Member ({formatVND(memberPrice)})
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Chọn số lượng */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Số lượng:
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          handleChangeQuantity(
                            activity.id,
                            quantity - 1,
                          )
                        }
                      >
                        -
                      </Button>
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) =>
                          handleChangeQuantity(
                            activity.id,
                            Number(e.target.value) || 1,
                          )
                        }
                        className="w-16 border rounded-md px-2 py-1 text-center text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          handleChangeQuantity(
                            activity.id,
                            quantity + 1,
                          )
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Giá & nút thêm giỏ */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">
                      {unitPrice === 0
                        ? "Miễn phí"
                        : `${formatVND(unitPrice)} x ${quantity}`}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddToCart(activity)}
                    >
                      Thêm vào giỏ
                    </Button>
                  </div>
                  {/* Nút xem người tham gia cho hoạt động này */}
                <div className="mt-2 flex justify-end">
                  <Link href={`/participants?activity_id=${activity.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      Xem người tham gia
                    </Button>
                  </Link>
                </div> 
                </div>
              )
                    
            })}
          </div>
        )}
      </main>
    </div>
  )
}
