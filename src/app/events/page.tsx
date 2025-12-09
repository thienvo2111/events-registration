"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/context/CartContext"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatVND } from "@/lib/format"
import type { Activity, CartItem, PricingType } from "@/lib/types"
import { Minus, Plus, ShoppingCart, Users } from "lucide-react"

export default function EventsPage() {
  const supabase = createSupabaseClient()
  const { state, addItem } = useCart()
  const router = useRouter()

  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [quantities, setQuantities] = useState<
    Record<string, Record<string, number>>
  >({})

  useEffect(() => {
    loadActivities()
  }, [])

  async function loadActivities() {
    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from("activities")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (err) throw err

      setActivities(data || [])

      const initQuantities: Record<string, Record<string, number>> = {}
      data?.forEach((activity: Activity) => {
        initQuantities[activity.id] = {
          member: 1,
          non_member: 1,
        }
      })
      setQuantities(initQuantities)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }

  function handleChangeQuantity(
    activityId: string,
    pricingType: PricingType,
    change: number,
  ) {
    setQuantities((prev) => {
      const current = prev[activityId]?.[pricingType] ?? 1
      const newQuantity = Math.max(1, current + change)
      return {
        ...prev,
        [activityId]: {
          ...prev[activityId],
          [pricingType]: newQuantity,
        },
      }
    })
  }

  function handleAddToCart(activity: Activity, pricingType: PricingType) {
    const quantity = quantities[activity.id]?.[pricingType] ?? 1
    const price =
      pricingType === "member"
        ? activity.price_member || 0
        : activity.price_non_member || 0

    const cartItem: CartItem = {
      activityId: activity.id,
      title: activity.title,
      quantity,
      unitPrice: price,
      pricingType,
    }

    addItem(cartItem)

    setQuantities((prev) => ({
      ...prev,
      [activity.id]: {
        ...prev[activity.id],
        [pricingType]: 1,
      },
    }))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#3b0008]">
        <div className="text-center text-amber-100">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-amber-400" />
          <p className="mt-4">Đang tải danh sách hoạt động...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#3b0008] px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-red-100">
          Lỗi khi tải dữ liệu: {error}
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="bg-[#3b0008] px-4 py-10">
        <div className="mx-auto max-w-4xl text-center text-amber-100">
          Không có hoạt động nào
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#3b0008] px-4 py-8 text-amber-50 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:mb-10 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-amber-50 md:text-3xl">
              Các hoạt động
            </h1>
            <p className="mt-2 text-sm text-amber-100/85">
              Tổng: {activities.length} hoạt động
            </p>
          </div>
          <Button
            onClick={() => router.push("/cart")}
            className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-[#3b0008] hover:bg-amber-300 md:px-5"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Giỏ hàng ({state.totalItems})
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
          {activities.map((activity) => (
            <Card
              key={activity.id}
              className="flex h-full flex-col overflow-hidden rounded-lg border border-[#8b1c1f]/50 bg-[#2a0006]/90 text-amber-50 shadow-sm"
            >
              <CardHeader className="border-b border-[#8b1c1f]/40 pb-3">
                <CardTitle className="text-base font-semibold md:text-lg">
                  {activity.title}
                </CardTitle>
                {activity.description && (
                  <div className="max-h-32 overflow-y-auto rounded-md bg-black/20 p-2 text-xs leading-relaxed text-amber-100/90 md:text-sm scrollbar-thin">
                    {activity.description}
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex flex-1 flex-col pt-4">
                <div className="mb-4 space-y-2 text-xs text-amber-100/90 md:text-sm">
                  {activity.start_date && (
                    <div>
                      <p className="text-[15px] text-amber-200/80">
                        Thời gian: {new Date(activity.start_date).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  )}
                  {activity.location && (
                    <div>
                      <p className="text-[15px] text-amber-200/80">Địa điểm: {activity.location}</p>
                    </div>
                  )}
                </div>
                <div className="mt-auto space-y-4">
                  {/* Pricing Section - 2 cột trên desktop, 1 cột trên mobile */}
                  <div className="mt-auto space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {/* Member Pricing */}
                      <div className="rounded-lg bg-blue-50/10 p-3 md:p-4">
                        <p className="text-xs font-semibold text-amber-50 mb-2">Giá Member</p>
                        <p className="text-xl font-bold text-blue-300 mb-2">
                          {formatVND(activity.price_member || 0)}
                        </p>

                        <div className="flex items-center justify-center gap-2 mb-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full border-amber-200/60 bg-black/30 text-amber-50 hover:bg-black/50"
                            onClick={() =>
                              handleChangeQuantity(activity.id, "member", -1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold text-amber-50">
                            {quantities[activity.id]?.member ?? 1}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full border-amber-200/60 bg-black/30 text-amber-50 hover:bg-black/50"
                            onClick={() =>
                              handleChangeQuantity(activity.id, "member", 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          onClick={() => handleAddToCart(activity, "member")}
                          className="w-full rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
                        >
                          Thêm vào giỏ
                        </Button>
                      </div>

                      {/* Non-member Pricing */}
                      <div className="rounded-lg bg-orange-50/10 p-3 md:p-4">
                        <p className="text-xs font-semibold text-amber-50 mb-2">Giá Non-Member</p>
                        <p className="text-xl font-bold text-orange-300 mb-2">
                          {formatVND(activity.price_non_member || 0)}
                        </p>

                        <div className="flex items-center justify-center gap-2 mb-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full border-amber-200/60 bg-black/30 text-amber-50 hover:bg-black/50"
                            onClick={() =>
                              handleChangeQuantity(activity.id, "non_member", -1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold text-amber-50">
                            {quantities[activity.id]?.non_member ?? 1}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full border-amber-200/60 bg-black/30 text-amber-50 hover:bg-black/50"
                            onClick={() =>
                              handleChangeQuantity(activity.id, "non_member", 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          onClick={() => handleAddToCart(activity, "non_member")}
                          className="w-full rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600"
                        >
                          Thêm vào giỏ
                        </Button>
                      </div>
                    </div>
                  </div>


                  <Button
                    onClick={() =>
                      router.push(`/participants?activity_id=${activity.id}`)
                    }
                    variant="outline"
                    className="w-full rounded-full border-amber-200/60 bg-black/20 text-sm font-semibold text-amber-100 hover:bg-black/40"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Xem danh sách người tham dự
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
