import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.NEXT_PUBLIC_SMTP_HOST,
  port: Number(process.env.NEXT_PUBLIC_SMTP_PORT || 587),
  secure: false, // TLS STARTTLS
  auth: {
    user: process.env.NEXT_PUBLIC_SMTP_USER,
    pass: process.env.NEXT_PUBLIC_SMTP_PASS,
  },
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to, full_name, order } = body as {
      to: string
      full_name: string
      order: {
        order_code: string
        amount: number
        qr_url?: string
        bank_code: string
        account_number: string
        account_name: string
        items: {
          activityId: string
          title: string
          quantity: number
          unitPrice: number
          pricingType: "member" | "non_member"
        }[]
      }
    }

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding:4px 0;">
            ${item.title} x ${item.quantity} (${
          item.pricingType === "member" ? "Member" : "Non-member"
        })
          </td>
          <td style="padding:4px 0; text-align:right;">
            ${Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(item.unitPrice * item.quantity)}
          </td>
        </tr>`,
      )
      .join("")

    const totalHtml = Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(order.amount)

    const html = `
      <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#3b0008;padding:24px;color:#fef3c7;">
        <div style="max-width:640px;margin:0 auto;background:#2a0006;border-radius:16px;padding:24px;">
          <h1 style="text-align:center;font-size:22px;font-weight:700;margin:0 0 8px;">XIN CẢM ƠN ANH/CHỊ.</h1>
          <p style="text-align:center;margin:0 0 16px;">Đăng ký của Anh/Chị đã được ghi nhận</p>
          <p style="text-align:center;margin:0 0 24px;">
            Mã đơn hàng:
            <span style="font-family:monospace;font-weight:700;">${order.order_code}</span>
          </p>

          <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;color:#111827;">
            <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;">Chi tiết đơn hàng</h2>
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tbody>
                ${itemsHtml}
                <tr>
                  <td style="padding-top:8px;border-top:1px solid #e5e7eb;font-weight:600;">Tổng cộng</td>
                  <td style="padding-top:8px;border-top:1px solid #e5e7eb;font-weight:600;text-align:right;">${totalHtml}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${
            order.qr_url
              ? `<div style="text-align:center;margin-bottom:24px;">
                  <p style="margin-bottom:8px;font-weight:600;">Vui lòng quét mã QR dưới đây để thanh toán.</p>
                  <img src="${order.qr_url}" alt="QR thanh toán" style="width:240px;height:240px;border-radius:12px;background:#ffffff;padding:8px;"/>
                 </div>`
              : ""
          }

          <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;color:#111827;">
            <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;">Thông tin thanh toán</h2>
            <p><strong>Ngân hàng:</strong> ${order.bank_code} - Vietcombank</p>
            <p><strong>Tài khoản:</strong> ${order.account_number}</p>
            <p><strong>Chủ tài khoản:</strong> ${order.account_name}</p>
            <p><strong>Số tiền:</strong> ${totalHtml}</p>
            <p><strong>Nội dung chuyển khoản:</strong> 
              <span style="font-family:monospace;font-weight:700;">${order.order_code}</span>
            </p>
          </div>

          <p style="font-size:13px;line-height:1.5;margin-bottom:0;">
            Anh/Chị có thể thanh toán ngay hoặc chuyển khoản sau. Ban tổ chức sẽ xác nhận thanh toán
            và gửi thông tin tiếp theo qua email/SMS.
          </p>
        </div>
      </div>
    `
    console.log(transporter)

    await transporter.sendMail({
      from: process.env.NEXT_PUBLIC_SMTP_FROM,
      to,
      subject: `Xác nhận đăng ký – Mã đơn ${order.order_code}`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("send-confirmation-email error:", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
