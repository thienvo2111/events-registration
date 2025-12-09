"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SearchOrderSchema } from "@/lib/validations"
import { supabase } from "@/lib/supabase"
import { formatVND } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type SearchForm = {
  search_by: "order_code" | "phone_number"
  value: string
}

export default function SearchPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SearchForm>({
    resolver: zodResolver(SearchOrderSchema),
    defaultValues: { search_by: "order_code" },
  })

  const searchBy = watch("search_by")

  async function onSubmit(data: SearchForm) {
  setLoading(true)
  setError(null)
  setResults([])

  try {
    if (data.search_by === "order_code") {
      // Tìm trực tiếp theo mã đơn
      const { data: orders, error: err } = await supabase
        .from("orders")
        .select(`
          id,
          order_code,
          created_at,
          payment_status,
          total_amount,
          registration:registrations(
            full_name,
            phone_number,
            email,
            title,
            seat_req,
            spec_req,
            note,
            unit:units(name)
          ),
          order_items(
            activity_id,
            quantity,
            price_per_unit,
            subtotal,
            activities(title)
          )
        `)
        .eq("order_code", data.value.trim())
        .order("created_at", { ascending: false })

      if (err) throw err
      setResults(orders || [])
    } else {
      // 1. Tìm các registration theo SĐT
      const phone = data.value.trim()
      const { data: regs, error: regErr } = await supabase
        .from("registrations")
        .select("id")
        .eq("phone_number", phone)

      if (regErr) throw regErr
      if (!regs || regs.length === 0) {
        setResults([])
        return
      }

      const regIds = regs.map((r) => r.id)

      // 2. Lấy tất cả orders có registration_id trong regIds
      const { data: orders, error: err } = await supabase
        .from("orders")
        .select(`
          id,
          order_code,
          created_at,
          payment_status,
          total_amount,
          registration:registrations(
            full_name,
            phone_number,
            email,
            title,
            seat_req,
            spec_req,
            note,
            unit:units(name)
          ),
          order_items(
            activity_id,
            quantity,
            price_per_unit,
            subtotal,
            activities(title)
          )
        `)
        .in("registration_id", regIds)
        .order("created_at", { ascending: false })

      if (err) throw err
      setResults(orders || [])
    }
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Không thể tìm kiếm đơn hàng. Vui lòng thử lại.",
    )
  } finally {
    setLoading(false)
  }
}


  const formatDate = (d: string) =>
    new Date(d).toLocaleString("vi-VN", {
      hour12: false,
    })

  return (
    <div className="min-h-screen bg-[#3b0008] px-4 py-8 text-amber-50 md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Tra cứu đơn hàng
          </h1>
          <p className="mt-2 text-sm text-amber-100/85">
            Tìm thông tin đơn hàng của bạn bằng mã đơn hoặc số điện thoại
          </p>
        </header>

        <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-6 text-amber-50">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2 text-sm">
                <p className="font-medium text-amber-100">Tìm kiếm theo</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      value="order_code"
                      {...register("search_by")}
                      checked={searchBy === "order_code"}
                      className="cursor-pointer"
                    />
                    <span>Mã đơn hàng</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      value="phone_number"
                      {...register("search_by")}
                      checked={searchBy === "phone_number"}
                      className="cursor-pointer"
                    />
                    <span>Số điện thoại</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
                <input
                  {...register("value")}
                  className="flex-1 rounded-md border border-amber-200/40 bg-black/30 px-3 py-2 text-sm text-amber-50 placeholder:text-amber-200/60 focus:border-amber-300 focus:outline-none"
                  placeholder={
                    searchBy === "order_code"
                      ? "Nhập mã đơn (ví dụ: JCI2026...)"
                      : "Nhập số điện thoại đã đăng ký"
                  }
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-[#3b0008] hover:bg-amber-300"
                >
                  {loading ? "Đang tìm..." : "Tìm kiếm"}
                </Button>
              </div>
            </div>
            {errors.value && (
              <p className="text-xs text-red-300">
                {errors.value.message as string}
              </p>
            )}
          </form>
        </Card>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-900/40 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {results.length === 0 && !loading && !error && (
          <p className="text-center text-sm text-amber-100/80">
            Không tìm thấy đơn hàng. Hãy kiểm tra lại thông tin bạn đã nhập.
          </p>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-amber-100/85">
              Tìm thấy {results.length} đơn hàng
            </p>

            {results.map((order) => {
              const reg = order.registration
              const itemCount = order.order_items?.length ?? 0
              const unitName = reg?.unit?.name ?? "—"
              return (
                <Card
                  key={order.id}
                  className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-4 text-sm text-amber-50 md:p-5"
                >
                  <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                    <div className="space-y-1">
                      <p className="text-xs text-amber-200/80">
                        Thời gian tạo đơn
                      </p>
                      <p className="font-medium">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-xs text-amber-200/80">Mã đơn hàng</p>
                      <p className="font-mono text-sm font-semibold">
                        {order.order_code}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          order.payment_status === "paid"
                            ? "bg-green-500/20 text-green-300"
                            : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {order.payment_status === "paid"
                          ? "Đã thanh toán"
                          : "Chờ thanh toán"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 grid gap-3 border-t border-[#8b1c1f]/40 pt-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs text-amber-200/80">Tên</p>
                      <p className="font-medium">
                        {reg?.full_name || "—"}
                      </p>
                      <p className="text-xs text-amber-200/80">
                        Số điện thoại
                      </p>
                      <p className="font-medium">
                        {reg?.phone_number || "—"}
                      </p>
                      <p className="text-xs text-amber-200/80">Email</p>
                      <p className="font-medium">
                        {reg?.email || "—"}
                      </p>
                      <p className="text-xs text-amber-200/80">
                        Đơn vị / Chapter
                      </p>
                      <p className="font-medium">{unitName}</p>
                      <p className="text-xs text-amber-200/80">
                        Chức danh hiện tại
                      </p>
                      <p className="font-medium">
                        {reg?.title || "—"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-amber-200/80">
                        Ưu tiên chỗ ngồi
                      </p>
                      <p className="font-medium">
                        {reg?.seat_req === "chapter_table"
                          ? "Ưu tiên ngồi theo bàn của Chapter"
                          : reg?.seat_req === "protocol"
                          ? "Ưu tiên ngồi theo vị trí Protocol do BTC sắp xếp"
                          : "—"}
                      </p>
                      <p className="mt-2 text-xs text-amber-200/80">
                        Yêu cầu đặc biệt
                      </p>
                      <p className="text-sm">
                        {reg?.spec_req || "—"}
                      </p>
                      <p className="mt-2 text-xs text-amber-200/80">
                        Ghi chú
                      </p>
                      <p className="text-sm">
                        {reg?.note || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-[#8b1c1f]/40 pt-3 text-sm">
                    <p className="mb-1 font-semibold">
                      Danh sách hoạt động ({itemCount}):
                    </p>
                    <div className="space-y-1">
                      {order.order_items?.map((it: any) => (
                        <div
                          key={`${it.activity_id}-${it.activities?.title}`}
                          className="flex justify-between"
                        >
                          <span>
                            {it.activities?.title || "—"} x {it.quantity}
                          </span>
                          <span>
                            {formatVND(it.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between border-t border-[#8b1c1f]/40 pt-2 font-semibold">
                      <span>Tổng cộng</span>
                      <span className="text-amber-300">
                        {formatVND(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
