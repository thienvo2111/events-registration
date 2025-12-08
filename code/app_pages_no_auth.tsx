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

// ============================================================================
// app/events/page.tsx - Browse Events
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { Activity } from '@/lib/types';
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EventsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const { addItem, state } = useCart();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setActivities(data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const handleAddToCart = (activity: Activity) => {
    const quantity = quantities[activity.id] || 1;
    addItem({
      activityId: activity.id,
      activity,
      quantity,
      pricePerUnit: activity.price,
    });
    setAddedItems(new Set([...addedItems, activity.id]));
    setTimeout(() => {
      setAddedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(activity.id);
        return newSet;
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Các hoạt động</h1>
          <p className="text-gray-600 mt-2">
            Tổng: {activities.length} hoạt động
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/cart">
            <Button variant="outline" size="lg" className="relative">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Giỏ hàng
              {state.totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {state.totalItems}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>
      </div>

      {activities.length === 0 ? (
        <Card className="p-12 text-center text-gray-600">
          Không có hoạt động nào
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <Card
              key={activity.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">{activity.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {activity.description}
                </p>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  {activity.location && <p>📍 {activity.location}</p>}
                  {activity.max_participants && (
                    <p>
                      👥 {activity.current_participants}/{activity.max_participants} người
                    </p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-gray-600 text-sm">Giá</p>
                      <p className="text-2xl font-bold">
                        {activity.price === 0 ? 'Miễn phí' : formatVND(activity.price)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={
                          activity.max_participants
                            ? Math.max(
                                1,
                                activity.max_participants - activity.current_participants
                              )
                            : 100
                        }
                        value={quantities[activity.id] || 1}
                        onChange={(e) =>
                          setQuantities({
                            ...quantities,
                            [activity.id]: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-16 px-2 py-1 border rounded text-center"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAddToCart(activity)}
                    className="w-full"
                    variant={addedItems.has(activity.id) ? 'default' : 'outline'}
                  >
                    {addedItems.has(activity.id) ? '✓ Đã thêm' : 'Thêm vào giỏ'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// app/cart/page.tsx - Shopping Cart
// ============================================================================

'use client';

import { useCart } from '@/context/CartContext';
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, ArrowLeft, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const { state, removeItem, updateQuantity } = useCart();

  if (state.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Giỏ hàng</h1>
        <Card className="p-12 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">Giỏ hàng trống</p>
          <Link href="/events">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tiếp tục mua sắm
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Giỏ hàng</h1>
        <Link href="/events">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tiếp tục mua
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {state.items.map((item) => (
            <Card key={item.activityId} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{item.activity?.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {item.activity?.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.activityId)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Số lượng</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.activityId, parseInt(e.target.value) || 1)
                      }
                      className="w-16 px-2 py-1 border rounded text-center mt-1"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Giá/Đơn vị</p>
                    <p className="font-semibold">{formatVND(item.pricePerUnit)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Thành tiền</p>
                  <p className="text-xl font-bold">
                    {formatVND(item.pricePerUnit * item.quantity)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div>
          <Card className="p-6 sticky top-4">
            <h2 className="text-lg font-bold mb-6">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 mb-6 pb-6 border-b">
              <div className="flex justify-between">
                <span className="text-gray-600">Số lượng sản phẩm</span>
                <span className="font-semibold">{state.totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số hoạt động</span>
                <span className="font-semibold">{state.items.length}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Tổng cộng</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatVND(state.totalAmount)}
                </span>
              </div>
            </div>

            <Link href="/checkout">
              <Button className="w-full" size="lg">
                Tiến hành thanh toán
              </Button>
            </Link>

            <Link href="/events">
              <Button variant="outline" className="w-full mt-2">
                Tiếp tục mua
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// app/checkout/page.tsx - Checkout (Nhập thông tin)
// ============================================================================

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { CheckoutSchema } from '@/lib/validations';
import { generateOrderCode, formatVND } from '@/lib/utils';
import { createPaymentQRCode } from '@/lib/qr-generator';
import { VIETQR_CONFIG } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const { state, clearCart } = useCart();
  const [units, setUnits] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState<{
    order_code: string;
    qr_url?: string;
    bank_code: string;
    account_number: string;
    amount: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(CheckoutSchema),
  });

  // Fetch units
  React.useEffect(() => {
    const fetchUnits = async () => {
      const { data } = await supabase.from('units').select('*');
      setUnits(data || []);
    };
    fetchUnits();
  }, []);

  if (state.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="mb-4 text-gray-600">Giỏ hàng trống</p>
          <Link href="/events">
            <Button>Quay lại mua sắm</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: any) => {
    try {
      setIsProcessing(true);

      // 1. Create registration
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .insert({
          full_name: data.full_name,
          phone_number: data.phone_number,
          email: data.email,
          unit_id: data.unit_id,
        })
        .select()
        .single();

      if (regError) throw regError;

      // 2. Create order
      const orderCode = generateOrderCode();
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          registration_id: regData.id,
          total_amount: state.totalAmount,
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Create order items
      const orderItems = state.items.map((item) => ({
        order_id: orderData.id,
        activity_id: item.activityId,
        quantity: item.quantity,
        price_per_unit: item.pricePerUnit,
        subtotal: item.pricePerUnit * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. Create attendees
      const attendees = state.items.map((item) => ({
        order_id: orderData.id,
        activity_id: item.activityId,
        full_name: data.full_name,
        phone_number: data.phone_number,
        email: data.email,
        unit_id: data.unit_id,
        is_primary: true,
      }));

      const { error: attendeesError } = await supabase
        .from('attendees')
        .insert(attendees);

      if (attendeesError) throw attendeesError;

      // 5. Generate QR code
      const qrData = await createPaymentQRCode(
        VIETQR_CONFIG.ADMIN_ACCOUNT.bank_code,
        VIETQR_CONFIG.ADMIN_ACCOUNT.account_number,
        state.totalAmount,
        orderCode,
        VIETQR_CONFIG.ADMIN_ACCOUNT.beneficiary_name
      );

      // 6. Update order with QR
      await supabase
        .from('orders')
        .update({
          qr_code_string: qrData.qr_string,
          qr_code_url: qrData.qr_url,
        })
        .eq('id', orderData.id);

      setOrderCreated({
        order_code: orderCode,
        qr_url: qrData.qr_url,
        bank_code: qrData.bank_code,
        account_number: qrData.account_number,
        amount: state.totalAmount,
      });

      clearCart();
    } catch (error) {
      alert('Lỗi: ' + (error instanceof Error ? error.message : 'Không thể tạo đơn hàng'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderCreated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">Đơn hàng được tạo thành công!</h1>
          <p className="text-gray-600 mb-4">Mã đơn hàng: <span className="font-mono font-bold">{orderCreated.order_code}</span></p>

          {orderCreated.qr_url && (
            <div className="my-8 flex justify-center">
              <img
                src={orderCreated.qr_url}
                alt="QR Code"
                className="h-64 w-64 border-4 border-gray-200 rounded"
              />
            </div>
          )}

          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <h2 className="font-semibold mb-3">Thông tin thanh toán</h2>
            <div className="text-left space-y-2 text-sm">
              <p><span className="font-semibold">Ngân hàng:</span> {orderCreated.bank_code}</p>
              <p><span className="font-semibold">Tài khoản:</span> {orderCreated.account_number}</p>
              <p><span className="font-semibold">Số tiền:</span> {formatVND(orderCreated.amount)}</p>
              <p><span className="font-semibold">Nội dung:</span> {orderCreated.order_code}</p>
            </div>
          </Card>

          <p className="text-gray-600 mb-4">
            Hãy chuyển khoản với nội dung: <span className="font-mono font-bold">{orderCreated.order_code}</span>
          </p>

          <div className="space-y-2">
            <Link href="/search">
              <Button className="w-full">Tra cứu đơn hàng</Button>
            </Link>
            <Link href="/events">
              <Button variant="outline" className="w-full">
                Quay lại mua sắm
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Thanh toán</h1>

      <div className="grid gap-8">
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Đơn hàng của bạn</h2>
          <div className="space-y-3">
            {state.items.map((item) => (
              <div key={item.activityId} className="flex justify-between">
                <span>
                  {item.activity?.title} x {item.quantity}
                </span>
                <span>{formatVND(item.pricePerUnit * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Tổng cộng</span>
              <span>{formatVND(state.totalAmount)}</span>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-6">Thông tin đăng ký</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Họ tên *</label>
                <input
                  {...register('full_name')}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Nhập họ tên"
                />
                {errors.full_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.full_name.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại *</label>
                <input
                  {...register('phone_number')}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Nhập số điện thoại"
                />
                {errors.phone_number && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone_number.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Nhập email (tùy chọn)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Đơn vị công tác *</label>
                <select
                  {...register('unit_id')}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Chọn đơn vị</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
                {errors.unit_id && (
                  <p className="text-red-600 text-sm mt-1">{errors.unit_id.message as string}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                disabled={isProcessing}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Hoàn tất và tạo mã QR'
                )}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
