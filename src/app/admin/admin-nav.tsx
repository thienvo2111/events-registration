'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Package, TrendingUp, Users } from 'lucide-react';

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: BarChart3,
  },
  {
    label: 'Đơn hàng',
    href: '/admin/orders',
    icon: Package,
  },
  {
    label: 'Thống kê',
    href: '#',
    icon: TrendingUp,
    submenu: [
      {
        label: 'Hoạt động',
        href: '/admin/statistics/activities',
      },
      {
        label: 'Chapter / Đơn vị',
        href: '/admin/statistics/units',
      },
      {
        label: 'Chi tiết đơn hàng',
        href: '/admin/statistics/orders-detail',
      },
    ],
  },
  {
    label: 'Người tham dự',
    href: '/participants',
    icon: Users,
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#2a0006]/90 border-b border-[#8b1c1f]/50">
      <div className="max-w-full mx-auto px-6 py-4">
        <div className="flex items-center gap-8 overflow-x-auto">
          {navItems.map((item) => (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                  pathname.startsWith(item.href.split('#')[0])
                    ? 'bg-amber-600/30 text-amber-200'
                    : 'text-amber-200/70 hover:text-amber-200'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>

              {/* Submenu */}
              {item.submenu && (
                <div className="absolute left-0 hidden group-hover:block pt-2">
                  <div className="bg-[#3b0008] border border-[#8b1c1f]/50 rounded-lg shadow-lg overflow-hidden">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        className={`block px-4 py-2 text-sm transition whitespace-nowrap ${
                          pathname === subitem.href
                            ? 'bg-amber-600/30 text-amber-200'
                            : 'text-amber-200/70 hover:bg-[#2a0006]/50 hover:text-amber-200'
                        }`}
                      >
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
