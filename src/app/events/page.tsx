"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/context/CartContext"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({})

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
      
      // Initialize quantities
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
    change: number
  ) {
    setQuantities((prev) => {
      const current = prev[activityId]?.[pricingType] || 1
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
    const quantity = quantities[activity.id]?.[pricingType] || 1
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
    
    // Reset quantity after adding
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách hoạt động...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-700">Lỗi khi tải dữ liệu: {error}</p>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Không có hoạt động nào</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Các hoạt động</h1>
            <p className="text-gray-600 mt-2">
              Tổng: {activities.length} hoạt động
            </p>
          </div>
          <Button
            onClick={() => router.push("/cart")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Giỏ hàng ({state.totalItems})
          </Button>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <Card key={activity.id} className="overflow-hidden flex flex-col">
              {/* Activity Header */}
              <CardHeader>
                <CardTitle className="line-clamp-2">{activity.title}</CardTitle>
                {activity.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                    {activity.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Activity Details */}
                <div className="space-y-3 mb-4">
                  {activity.start_date && (
                    <div>
                      <p className="text-xs text-gray-500">Thời gian</p>
                      <p className="text-sm font-medium">
                        {new Date(activity.start_date).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  )}
                  {activity.location && (
                    <div>
                      <p className="text-xs text-gray-500">Địa điểm</p>
                      <p className="text-sm font-medium">{activity.location}</p>
                    </div>
                  )}
                  {activity.max_participants && (
                    <div>
                      <p className="text-xs text-gray-500">Số chỗ tối đa</p>
                      <p className="text-sm font-medium">
                        {activity.max_participants}
                      </p>
                    </div>
                  )}
                </div>

                {/* Pricing Section */}
                <div className="space-y-4 mt-auto">
                  {/* Member Pricing */}
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-sm text-gray-600 mb-2">Giá Member</p>
                    <p className="text-2xl font-bold text-blue-600 mb-3">
                      {formatVND(activity.price_member || 0)}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleChangeQuantity(activity.id, "member", -1)
                        }
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={quantities[activity.id]?.member || 1}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value) || 1)
                          setQuantities((prev) => ({
                            ...prev,
                            [activity.id]: {
                              ...prev[activity.id],
                              member: val,
                            },
                          }))
                        }}
                        className="w-16 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleChangeQuantity(activity.id, "member", 1)
                        }
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={() =>
                        handleAddToCart(activity, "member")
                      }
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Thêm vào giỏ
                    </Button>
                  </div>

                  {/* Non-Member Pricing */}
                  <div className="bg-orange-50 p-4 rounded">
                    <p className="text-sm text-gray-600 mb-2">Giá Non-Member</p>
                    <p className="text-2xl font-bold text-orange-600 mb-3">
                      {formatVND(activity.price_non_member || 0)}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleChangeQuantity(activity.id, "non_member", -1)
                        }
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={quantities[activity.id]?.non_member || 1}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value) || 1)
                          setQuantities((prev) => ({
                            ...prev,
                            [activity.id]: {
                              ...prev[activity.id],
                              non_member: val,
                            },
                          }))
                        }}
                        className="w-16 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleChangeQuantity(activity.id, "non_member", 1)
                        }
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={() =>
                        handleAddToCart(activity, "non_member")
                      }
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      Thêm vào giỏ
                    </Button>
                  </div>

                  {/* View Participants Button */}
                  <Button
                    onClick={() =>
                      router.push(`/participants?activity_id=${activity.id}`)
                    }
                    variant="outline"
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
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
