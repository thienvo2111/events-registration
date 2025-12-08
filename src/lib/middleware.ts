import { NextResponse, type NextRequest } from "next/server"

// Middleware này xử lý route protection
// Admin routes được bảo vệ ở client-side thông qua login check
export function middleware(req: NextRequest) {
  // Allow all requests - auth checks are handled client-side
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
