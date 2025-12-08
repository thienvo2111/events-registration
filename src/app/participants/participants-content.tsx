"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createSupabaseClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ParticipantRow {
  id: string
  full_name: string
  phone_number: string
  email?: string | null
  unit_name?: string | null
}

export default function ParticipantsContent() {
  const supabase = createSupabaseClient()
  const searchParams = useSearchParams()
  const activityId = searchParams.get("activity_id")

  const [attendees, setAttendees] = useState<ParticipantRow[]>([])
  const [activityTitle, setActivityTitle] = useState("Hoạt động")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activityId) return

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // Step 1: Get activity title
        const { data: activityData, error: activityError } = await supabase
          .from("activities")
          .select("title")
          .eq("id", activityId)
          .single()

        if (!activityError && activityData) {
          setActivityTitle(activityData.title)
        }

        // Step 2: Get attendees with their order_id
        const { data: attendeeData, error: attendeeError } = await supabase
          .from("attendees")
          .select("order_id")
          .eq("activity_id", activityId)
          .eq("is_primary", true)
          .order("id", { ascending: true })

        if (attendeeError) {
          throw attendeeError
        }

        if (!attendeeData || attendeeData.length === 0) {
          setAttendees([])
          setLoading(false)
          return
        }

        const orderIds = attendeeData.map((a: any) => a.order_id)

        // Step 3: Get order registrations
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(
            `
            id,
            registration_id,
            registrations(
              id,
              full_name,
              phone_number,
              email
            )
          `
          )
          .in("id", orderIds)

        if (orderError) {
          throw orderError
        }

        // Step 4: Get units for each registration
        const participants: ParticipantRow[] = []
        
        for (const order of orderData || []) {
          const registrations = Array.isArray(order.registrations)
            ? order.registrations
            : order.registrations
            ? [order.registrations]
            : []

          for (const reg of registrations) {
            if (reg && typeof reg === "object" && "id" in reg) {
              participants.push({
                id: (reg as any).id,
                full_name: (reg as any).full_name || "",
                phone_number: (reg as any).phone_number || "",
                email: (reg as any).email || null,
                unit_name: null, // Will be populated below
              })
            }
          }
        }

        // Step 5: Get unit information for registrations
        if (participants.length > 0) {
          const registrationIds = participants.map((p) => p.id)

          const { data: registrationData, error: regError } = await supabase
            .from("registrations")
            .select(
              `
              id,
              unit:units(name)
            `
            )
            .in("id", registrationIds)

          if (!regError && registrationData) {
            const unitMap: Record<string, string | null> = {}
            for (const reg of registrationData) {
              let unitName: string | null = null
              
              const unit = (reg as any).unit
              if (Array.isArray(unit) && unit.length > 0 && unit[0]?.name) {
                unitName = unit[0].name
              } else if (unit && typeof unit === "object" && !Array.isArray(unit) && (unit as any).name) {
                unitName = (unit as any).name
              }
              
              unitMap[(reg as any).id] = unitName
            }

            // Update participants with unit information
            participants.forEach((p) => {
              p.unit_name = unitMap[p.id] || null
            })
          }
        }

        setAttendees(participants)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : "Lỗi khi tải dữ liệu")
        setAttendees([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [activityId, supabase])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {!activityId && (
          <Card className="p-6 text-center text-gray-600">
            <p>
              Vui lòng truy cập trang này từ trang hoạt động (có truyền
              activity_id).
            </p>
            <Link href="/">
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                Quay lại trang chính
              </Button>
            </Link>
          </Card>
        )}

        {activityId && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">{activityTitle}</h1>
              <Link href="/">
                <Button variant="outline">Quay lại</Button>
              </Link>
            </div>

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">
                  Đang tải danh sách người tham gia...
                </p>
              </div>
            )}

            {error && (
              <Card className="p-4 bg-red-50 border border-red-200">
                <p className="text-red-700">Lỗi khi tải dữ liệu: {error}</p>
              </Card>
            )}

            {!loading && !error && attendees.length === 0 && (
              <Card className="p-6 text-center text-gray-500">
                <p>Chưa có người tham gia nào cho hoạt động này.</p>
              </Card>
            )}

            {!loading && !error && attendees.length > 0 && (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-100">
                        <th className="px-4 py-3 text-left font-semibold">
                          STT
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Tên
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Số điện thoại
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">
                          Đơn vị
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map((attendee, idx) => (
                        <tr
                          key={attendee.id}
                          className="border-b hover:bg-gray-50 last:border-b-0"
                        >
                          <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium">
                            {attendee.full_name ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {attendee.phone_number ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {attendee.email ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {attendee.unit_name ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
