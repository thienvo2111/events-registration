import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res }) as SupabaseClient

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  const isAdminPath = pathname.startsWith("/admin")
  const isLoginPath = pathname === "/admin/login"

  // Chưa login mà vào /admin/* -> đưa về /admin/login
  if (isAdminPath && !session && !isLoginPath) {
    const url = req.nextUrl.clone()
    url.pathname = "/admin/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Đã login mà vào /admin/login -> chuyển sang dashboard
  if (isLoginPath && session) {
    const url = req.nextUrl.clone()
    url.pathname = "/admin/dashboard"
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ["/admin/:path*"],
}
