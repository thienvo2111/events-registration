// ============================================================================
// app/search/page.tsx - Search Orders by Code or Phone
// ============================================================================

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { OrderSearchResult } from '@/lib/types';
import { formatVND, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
  const [searchType, setSearchType] = useState<'order_code' | 'phone_number'>('order_code');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<OrderSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setNotFound(false);

      let query = supabase.from('order_summary').select('*');

      if (searchType === 'order_code') {
        query = query.eq('order_code', searchValue.toUpperCase());
      } else {
        query = query.eq('phone_number', searchValue);
      }

      const { data, error: err } = await query;

      if (err) throw err;

      if (!data || data.length === 0) {
        setNotFound(true);
        setResults([]);
      } else {
        setResults(
          data.map((order) => ({
            order_id: order.order_id,
            order_code: order.order_code,
            full_name: order.full_name,
            phone_number: order.phone_number,
            total_amount: order.total_amount,
            payment_status: order.payment_status,
            created_at: order.created_at,
            item_count: order.item_count,
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Tra cứu đơn hàng</h1>
          <p className="text-gray-600 mt-2">
            Tìm thông tin đơn hàng của bạn bằng mã đơn hoặc số điện thoại
          </p>
        </div>

        {/* Search Form */}
        <Card className="p-6 mb-8">
          <form onSubmit={handleSearch}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">
                  Tìm kiếm theo
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="order_code"
                      checked={searchType === 'order_code'}
                      onChange={(e) => setSearchType(e.target.value as any)}
                      className="mr-2"
                    />
                    <span>Mã đơn hàng</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="phone_number"
                      checked={searchType === 'phone_number'}
                      onChange={(e) => setSearchType(e.target.value as any)}
                      className="mr-2"
                    />
                    <span>Số điện thoại</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {searchType === 'order_code' ? 'Mã đơn hàng' : 'Số điện thoại'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={
                      searchType === 'order_code'
                        ? 'VD: ORD20240115XXXX'
                        : 'VD: 0901234567'
                    }
                    className="flex-1 px-4 py-2 border rounded"
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Tìm kiếm
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Not Found */}
        {notFound && (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              Không tìm thấy đơn hàng với
              {searchType === 'order_code' ? ' mã đơn' : ' số điện thoại'} này.
            </p>
            <p className="text-sm text-gray-500">
              Vui lòng kiểm tra lại thông tin và thử lại.
            </p>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tìm thấy {results.length} đơn hàng
            </p>
            {results.map((order) => (
              <Card key={order.order_id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Mã đơn hàng</p>
                      <p className="text-lg font-mono font-bold">{order.order_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Trạng thái</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          order.payment_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.payment_status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.payment_status === 'completed'
                          ? '✓ Đã thanh toán'
                          : order.payment_status === 'cancelled'
                          ? '✗ Đã hủy'
                          : '⏳ Chờ thanh toán'}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Tên</p>
                      <p className="font-semibold">{order.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Số điện thoại</p>
                      <p className="font-semibold">{order.phone_number}</p>
                    </div>
                    {order.email && (
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold">{order.email}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Tổng tiền</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatVND(order.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Số hoạt động</p>
                      <p className="font-semibold">{order.item_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ngày đặt</p>
                      <p className="font-semibold text-sm">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>

                  {order.payment_status === 'pending' && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
                      <p className="text-blue-900">
                        💡 Vui lòng chuyển khoản theo mã QR trong email xác nhận.
                        Trạng thái sẽ cập nhật tự động sau khi thanh toán.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Help Section */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <h3 className="font-bold mb-3">❓ Cần trợ giúp?</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Không tìm thấy đơn hàng:</strong> Kiểm tra lại mã đơn hoặc
              số điện thoại bạn nhập
            </li>
            <li>
              <strong>Quên mã đơn hàng:</strong> Sử dụng số điện thoại đã đăng ký
            </li>
            <li>
              <strong>Còn câu hỏi khác:</strong> Liên hệ support@example.com
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// lib/validations.ts - Updated Zod Schemas (No Auth)
// ============================================================================

import { z } from 'zod';

export const isValidPhoneNumber = (phone: string): boolean => {
  const vietnamPhoneRegex = /^(?:\+84|0)[1-9]\d{8,9}$/;
  return vietnamPhoneRegex.test(phone.replace(/\s/g, ''));
};

export const CheckoutSchema = z.object({
  full_name: z.string().min(2, 'Tên phải ít nhất 2 ký tự'),
  phone_number: z.string().refine(
    (val) => isValidPhoneNumber(val),
    'Số điện thoại không hợp lệ'
  ),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  unit_id: z.string().uuid('Chọn đơn vị công tác'),
});

export const SearchOrderSchema = z.object({
  search_by: z.enum(['order_code', 'phone_number']),
  value: z.string().min(1, 'Nhập thông tin tìm kiếm'),
});

export const ActivitySchema = z.object({
  title: z.string().min(3, 'Tên hoạt động phải ít nhất 3 ký tự'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  max_participants: z.coerce.number().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

export type CheckoutFormInput = z.infer<typeof CheckoutSchema>;
export type SearchOrderFormInput = z.infer<typeof SearchOrderSchema>;
export type ActivityFormInput = z.infer<typeof ActivitySchema>;
