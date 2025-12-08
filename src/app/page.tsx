// ============================================================================
// app/page.tsx - Landing Page (Trang chủ)
// ============================================================================

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Search, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">📋 Event Registration</div>
          <nav className="flex gap-4">
            <Link href="/events">
              <Button variant="ghost">Duyệt hoạt động</Button>
            </Link>
            <Link href="/search">
              <Button variant="outline">Tra cứu đơn hàng</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">
          Đăng ký sự kiện dễ dàng
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Không cần tạo tài khoản. Chỉ cần nhập thông tin và lựa chọn hoạt động.
          Tra cứu đơn hàng bằng mã đơn hoặc số điện thoại.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/events">
            <Button size="lg" className="gap-2">
              <ShoppingCart className="h-5 w-5" />
              Đặt sự kiện ngay
            </Button>
          </Link>
          <Link href="/search">
            <Button size="lg" variant="outline" className="gap-2">
              <Search className="h-5 w-5" />
              Tra cứu đơn hàng
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 text-center">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold mb-2">Không cần đăng ký</h3>
            <p className="text-gray-600">
              Nhập thông tin trực tiếp, không phải tạo tài khoản phức tạp
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl mb-4">🛒</div>
            <h3 className="text-xl font-bold mb-2">Chọn hoạt động dễ dàng</h3>
            <p className="text-gray-600">
              Duyệt tất cả sự kiện có sẵn, so sánh và chọn những cái bạn thích
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-bold mb-2">Thanh toán qua QR</h3>
            <p className="text-gray-600">
              Nhận mã QR chuyển khoản ngay lập tức, không phí xử lý
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Quy trình đăng ký</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { num: 1, title: 'Chọn hoạt động', desc: 'Duyệt danh sách sự kiện' },
              { num: 2, title: 'Thêm vào giỏ', desc: 'Chọn số lượng, thêm vào giỏ' },
              { num: 3, title: 'Nhập thông tin', desc: 'Nhập họ tên, SĐT, đơn vị' },
              { num: 4, title: 'Thanh toán', desc: 'Quét QR, chuyển khoản xong' },
            ].map((step) => (
              <Card key={step.num} className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {step.num}
                </div>
                <h3 className="font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-3xl font-bold mb-6">Sẵn sàng chưa?</h2>
        <Link href="/events">
          <Button size="lg" className="gap-2">
            Bắt đầu đăng ký
            <CheckCircle className="h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-4">📋 Hệ thống đăng ký sự kiện</p>
          <p className="text-gray-400 text-sm">
            © 2024. Không yêu cầu tài khoản. Tra cứu dễ dàng bằng mã đơn hoặc SĐT.
          </p>
        </div>
      </footer>
    </div>
  );
}