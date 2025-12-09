"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { useCart } from "@/context/CartContext"
import { supabase } from "@/lib/supabase"
import { CheckoutSchema, type CheckoutFormInput } from "@/lib/validations"
import { generateOrderCode, formatVND } from "@/lib/utils"
import { createPaymentQuickLink } from "@/lib/qr-generator"
import { VIETQR_CONFIG } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

type CheckoutForm = {
  full_name: string
  phone_number: string
  email?: string
  unit_id: string
  title?: string
  seat_req?: string
  spec_req?: string
  note?: string
}

interface OrderCreatedState {
  order_code: string
  qr_url?: string
  bank_code: string
  account_number: string
  account_name: string
  amount: number
  items: {
    activityId: string
    title: string
    quantity: number
    unitPrice: number
    pricingType: "member" | "non_member"
  }[]
}

export default function CheckoutPage() {
  const { state, clearCart } = useCart()
  const [units, setUnits] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderCreated, setOrderCreated] = useState<OrderCreatedState | null>(
    null,
  )

 const {
  register,
  handleSubmit,
  formState: { errors },
  watch,
} = useForm<CheckoutFormInput>({
  resolver: zodResolver(CheckoutSchema),
  defaultValues: {
    seat_req: "protocol",
  },
})

  const seatReqValue = watch("seat_req")

  // Fetch units
  useEffect(() => {
    const fetchUnits = async () => {
      const { data } = await supabase.from("units").select("*")
      setUnits(data || [])
    }
    fetchUnits()
  }, [])

  // Nếu đã tạo đơn → trang xác nhận
  if (orderCreated) {
    return (
      <div className="min-h-screen bg-[#3b0008] text-amber-50">
        <header className="border-b border-[#8b1c1f]/40 bg-[#2a0006]">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
            <h1 className="text-2xl font-bold text-amber-50">
              Xác nhận đăng ký
            </h1>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-8 md:px-6">
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-8 text-center text-amber-50">
            <div className="mb-4 text-5xl text-green-400">✓</div>
            <h1 className="mb-2 text-2xl font-bold">
              Đăng ký của bạn đã được ghi nhận
            </h1>
            <p className="mb-4 text-sm text-amber-100/80">
              Mã đơn hàng:&nbsp;
              <span className="font-mono font-bold">
                {orderCreated.order_code}
              </span>
            </p>

            <Card className="mb-6 border-[#8b1c1f]/40 bg-[#3b0008]/60 p-4 text-left text-amber-50">
              <h2 className="mb-3 font-semibold">Chi tiết đơn hàng</h2>
              <div className="space-y-2 text-sm">
                {orderCreated.items.map((item) => (
                  <div
                    key={item.activityId + "-" + item.pricingType}
                    className="flex justify-between"
                  >
                    <span>
                      {item.title} x {item.quantity} (
                      {item.pricingType === "member"
                        ? "Member"
                        : "Non-member"}
                      )
                    </span>
                    <span>
                      {formatVND(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-[#8b1c1f]/40 pt-2 font-semibold">
                  <span>Tổng cộng</span>
                  <span>{formatVND(orderCreated.amount)}</span>
                </div>
              </div>
            </Card>

            {orderCreated.qr_url && (
              <div className="my-6 flex justify-center">
                <img
                  src={orderCreated.qr_url}
                  alt="QR Code thanh toán"
                  className="h-64 w-64 rounded bg-white p-2 shadow-md"
                />
              </div>
            )}

            <Card className="mb-6 border-amber-200/40 bg-black/20 p-4 text-left text-amber-50">
              <h2 className="mb-3 font-semibold">Thông tin thanh toán</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Ngân hàng:</span>{" "}
                  {orderCreated.bank_code}
                </p>
                <p>
                  <span className="font-semibold">Tài khoản:</span>{" "}
                  {orderCreated.account_number}
                </p>
                <p>
                  <span className="font-semibold">Chủ tài khoản:</span>{" "}
                  {orderCreated.account_name}
                </p>
                <p>
                  <span className="font-semibold">Số tiền:</span>{" "}
                  {formatVND(orderCreated.amount)}
                </p>
                <p>
                  <span className="font-semibold">Nội dung chuyển khoản:</span>{" "}
                  <span className="font-mono font-bold">
                    {orderCreated.order_code}
                  </span>
                </p>
              </div>
            </Card>

            <p className="mb-4 text-sm text-amber-100/80">
              Vui lòng lưu lại mã đơn hàng và mã QR. Bạn có thể thanh toán
              ngay hoặc chuyển khoản sau. Ban tổ chức sẽ xác nhận thanh toán
              và gửi thông tin tiếp theo qua email/SMS.
            </p>

            <div className="space-y-2">
              <Link href="/search">
                <Button className="w-full rounded-full bg-amber-400 text-[#3b0008] hover:bg-amber-300">
                  Tra cứu đơn hàng
                </Button>
              </Link>
              <Link href="/events">
                <Button
                  variant="outline"
                  className="w-full rounded-full border-amber-200/60 bg-black/20 text-amber-100 hover:bg-black/40"
                >
                  Quay lại trang sự kiện
                </Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  // Nếu giỏ hàng trống
  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#3b0008] text-amber-50">
        <header className="border-b border-[#8b1c1f]/40 bg-[#2a0006]">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
            <h1 className="text-2xl font-bold">Thanh toán</h1>
            <Link href="/events">
              <Button
                variant="ghost"
                className="text-amber-100 hover:bg-amber-100/10"
              >
                Quay lại mua sắm
              </Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-16 md:px-6">
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-8 text-center text-amber-50">
            <p className="mb-4 text-sm text-amber-100/80">Giỏ hàng trống</p>
            <Link href="/events">
              <Button className="rounded-full bg-amber-400 text-[#3b0008] hover:bg-amber-300">
                Quay lại mua sắm
              </Button>
            </Link>
          </Card>
        </main>
      </div>
    )
  }

  const onSubmit = async (data: CheckoutFormInput) => {
    try {
      setIsProcessing(true)

      // 1. Create registration (thêm 4 field mới)
      const { data: regData, error: regError } = await supabase
          .from("registrations")
          .insert({
            full_name: data.full_name,
            phone_number: data.phone_number,
            email: data.email,
            unit_id: data.unit_id,
            title: data.title,
            seat_req: data.seat_req,
            spec_req: data.spec_req,
            note: data.note,
          })
          .select()
          .single()

      if (regError) {
        console.error("REG ERROR:", regError)
        throw regError
      }

      // 2. Create order
      const orderCode = generateOrderCode()
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_code: orderCode,
          registration_id: regData.id,
          total_amount: state.totalAmount,
          payment_status: "pending",
        })
        .select()
        .single()

      if (orderError) {
        console.error("ORDER ERROR:", orderError)
        throw orderError
      }

      // 3. Create order items
      const orderItems = state.items.map((item) => ({
        order_id: orderData.id,
        activity_id: item.activityId,
        quantity: item.quantity,
        price_per_unit: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)

      if (itemsError) {
        console.error("ORDER_ITEMS ERROR:", itemsError)
        throw itemsError
      }

      // 4. Create attendees (giữ unit + thêm thông tin đã lưu ở registrations)
      const attendees = state.items.map((item) => ({
        order_id: orderData.id,
        activity_id: item.activityId,
        full_name: data.full_name,
        phone_number: data.phone_number,
        email: data.email,
        unit_id: data.unit_id,
        is_primary: true,
      }))

      const { error: attendeesError } = await supabase
        .from("attendees")
        .insert(attendees)

      if (attendeesError) {
        console.error("ATTENDEES ERROR:", attendeesError)
        throw attendeesError
      }

      // 5. Generate QR
      const qrData = createPaymentQuickLink(
        VIETQR_CONFIG.ADMIN_ACCOUNT.bank_code,
        VIETQR_CONFIG.ADMIN_ACCOUNT.account_number,
        state.totalAmount,
        orderCode,
        VIETQR_CONFIG.ADMIN_ACCOUNT.beneficiary_name,
      )

      // 6. Update order with QR
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          qr_code_url: qrData.qr_url,
        })
        .eq("id", orderData.id)

      if (updateError) {
        console.error("UPDATE ORDER ERROR:", updateError)
        throw updateError
      }

      // 7. Lưu state để hiển thị trang xác nhận
      setOrderCreated({
        order_code: orderCode,
        qr_url: qrData.qr_url,
        bank_code: qrData.bank_code,
        account_number: qrData.account_number,
        account_name: qrData.account_name,
        amount: state.totalAmount,
        items: state.items,
      })

      clearCart()
    } catch (error) {
      console.error("Checkout error:", error)
      alert(
        "Lỗi: " +
          (error instanceof Error ? error.message : "Không thể tạo đơn hàng"),
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // Form checkout
  return (
    <div className="min-h-screen bg-[#3b0008] text-amber-50">
      <header className="border-b border-[#8b1c1f]/40 bg-[#2a0006]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <h1 className="text-2xl font-bold">Thanh toán</h1>
          <Link href="/cart">
            <Button
              variant="ghost"
              className="text-amber-100 hover:bg-amber-100/10"
            >
              Quay lại giỏ hàng
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        <div className="grid gap-8">
          {/* Tóm tắt đơn hàng */}
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-6 text-amber-50">
            <h2 className="mb-4 text-lg font-bold">Đơn hàng của bạn</h2>
            <div className="space-y-3 text-sm">
              {state.items.map((item) => (
                <div
                  key={item.activityId + "-" + item.pricingType}
                  className="flex justify-between"
                >
                  <span>
                    {item.title} x {item.quantity} (
                    {item.pricingType === "member"
                      ? "Member"
                      : "Non-member"}
                    )
                  </span>
                  <span>
                    {formatVND(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="mt-3 flex justify-between border-t border-[#8b1c1f]/40 pt-3 text-lg font-bold">
                <span>Tổng cộng</span>
                <span>{formatVND(state.totalAmount)}</span>
              </div>
            </div>
          </Card>

          {/* Form thông tin đăng ký */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-6 text-amber-50">
              <h2 className="mb-6 text-lg font-bold">Thông tin đăng ký</h2>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="mb-1 block font-medium">
                    Họ tên *
                  </label>
                  <input
                    {...register("full_name")}
                    className="w-full rounded-md border border-amber-200/40 bg-black/30 px-3 py-2 text-sm text-amber-50 placeholder:text-amber-200/60 focus:border-amber-300 focus:outline-none"
                    placeholder="Nhập họ tên"
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-xs text-red-300">
                      {errors.full_name.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-medium">
                    Số điện thoại *
                  </label>
                  <input
                    {...register("phone_number")}
                    className="w-full rounded-md border border-amber-200/40 bg-black/30 px-3 py-2 text-sm text-amber-50 placeholder:text-amber-200/60 focus:border-amber-300 focus:outline-none"
                    placeholder="Nhập số điện thoại"
                  />
                  {errors.phone_number && (
                    <p className="mt-1 text-xs text-red-300">
                      {errors.phone_number.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-medium">
                    Email
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    className="w-full rounded-md border border-amber-200/40 bg-black/30 px-3 py-2 text-sm text-amber-50 placeholder:text-amber-200/60 focus:border-amber-300 focus:outline-none"
                    placeholder="Nhập email (tùy chọn)"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium">
                    Đơn vị công tác / Chapter *
                  </label>
                  <select
                    {...register("unit_id")}
                    className="w-full rounded-md border border-amber-200/40 bg-black/30 px-3 py-2 text-sm text-amber-50 focus:border-amber-300 focus:outline-none"
                  >
                    <option value="">Chọn đơn vị</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                  {errors.unit_id && (
                    <p className="mt-1 text-xs text-red-300">
                      {errors.unit_id.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-medium">
                    Chức danh hiện tại
                  </label>
                  <input
                    {...register("title")}
                    className="w-full rounded-md border border-amber-200/40 bg-black/30 px-3 py-2 text-sm text-amber-50 placeholder:text-amber-200/60 focus:border-amber-300 focus:outline-none"
                    placeholder="Ví dụ: Chủ tịch Chapter, Thành viên..."
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium">
                    Anh/Chị ưu tiên chỗ ngồi của mình tại Đại Hội thế nào?
                  </label>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        value="protocol"
                        {...register("seat_req")}
                        checked={seatReqValue === "protocol"}
                        className="cursor-pointer"
                      />
                      <span>
                        Ưu tiên ngồi theo vị trí Protocol do BTC sắp xếp
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        value="chapter_table"
                        {...register("seat_req")}
                        checked={seatReqValue === "chapter_table"}
                        className="cursor-pointer"
                      />
                      <span>
                        Ưu tiên ngồi theo bàn của Chapter
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-medium">
                    Có yêu cầu gì đặc biệt
                  </label>
                  <textarea
                    {...register("spec_req")}
                    rows={2}
                    className="w-full rounded-md border border-amber-200/40 bg-black/30 px-3 py-2 text-sm text-amber-50 placeholder:text-amber-200/60 focus:border-amber-300 focus:outline-none"
                    placeholder="Ví dụ: ăn chay, dị ứng, hỗ trợ di chuyển..."
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium">
                    Ghi chú
                  </label>
                  <textarea
                    {...register("note")}
                    rows={2}
                    className="w-full rounded-md border border-amber-200/40 bg-black/30 px-3 py-2 text-sm text-amber-50 placeholder:text-amber-200/60 focus:border-amber-300 focus:outline-none"
                    placeholder="Ghi chú thêm cho ban tổ chức..."
                  />
                </div>

                <Button
                  type="submit"
                  className="mt-6 w-full rounded-full bg-amber-400 text-sm font-semibold text-[#3b0008] hover:bg-amber-300"
                  disabled={isProcessing}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Hoàn tất và tạo mã QR"
                  )}
                </Button>
              </div>
            </Card>
          </form>
        </div>
      </main>
    </div>
  )
}
