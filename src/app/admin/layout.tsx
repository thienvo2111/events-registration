"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { PropsWithChildren } from "react"
import { Button } from "@/components/ui/button"
import { createSupabaseClient } from "@/utils/supabase/client"

export default function AdminLayout({ children }: PropsWithChildren) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createSupabaseClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  const isActive = (href: string) => pathname === href

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 border-r border-slate-200 bg-white">
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          <span className="font-semibold text-slate-900">Admin</span>
        </div>
        <nav className="p-4 space-y-2 text-sm">
          <AdminLink href="/admin/dashboard" active={isActive("/admin/dashboard")}>
            Dashboard
          </AdminLink>
          {/* <AdminLink href="/admin/activities" active={isActive("/admin/activities")}>
            Hoạt động
          </AdminLink> */}
          <AdminLink href="/admin/orders" active={isActive("/admin/orders")}>
            Đơn hàng
          </AdminLink>
        </nav>
        <div className="p-4 border-t border-slate-200">
          <Button
            variant="outline"
            className="w-full justify-center text-red-600"
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}

function AdminLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={[
        "block rounded-md px-3 py-2",
        active
          ? "bg-slate-100 text-slate-900 font-medium"
          : "text-slate-600 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </Link>
  )
}
