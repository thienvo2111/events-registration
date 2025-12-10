'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/utils/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';

interface ActivityDetail {
  activity: string;
  qty: number;
}

interface OrderDetailStats {
  order_id: string;
  order_code: string;
  full_name: string;
  unit_name: string | null;
  title: string | null;
  member_activities: ActivityDetail[] | null;
  non_member_activities: ActivityDetail[] | null;
  total_member_qty: number;
  total_non_member_qty: number;
  total_qty: number;
  created_at: string;
}

export default function OrdersDetailStatisticsPage() {
  const [stats, setStats] = useState<OrderDetailStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createSupabaseClient();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc(
        'get_orders_detail_statistics'
      );

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setStats(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu thống kê'
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredStats = stats.filter(
    (item) =>
      item.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.unit_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = [
      'Mã đơn',
      'Người đăng ký',
      'Chapter',
      'Chức vụ',
      'Hoạt động (Thành viên)',
      'Số lượng (Thành viên)',
      'Hoạt động (Khách mời)',
      'Số lượng (Khách mời)',
      'Tổng tham gia',
      'Ngày đăng ký',
    ];

    const rows = stats.map((item) => {
      const memberActivities = (item.member_activities || [])
        .map((a) => `${a.activity} (${a.qty})`)
        .join('; ');
      const nonMemberActivities = (item.non_member_activities || [])
        .map((a) => `${a.activity} (${a.qty})`)
        .join('; ');

      return [
        item.order_code,
        item.full_name,
        item.unit_name || 'Không có',
        item.title || 'Không có',
        memberActivities || '-',
        item.total_member_qty,
        nonMemberActivities || '-',
        item.total_non_member_qty,
        item.total_qty,
        new Date(item.created_at).toLocaleString('vi-VN'),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders-detail-statistics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalAllMembers = stats.reduce((sum, s) => sum + s.total_member_qty, 0);
  const totalAllNonMembers = stats.reduce(
    (sum, s) => sum + s.total_non_member_qty,
    0
  );
  const totalAllQty = stats.reduce((sum, s) => sum + s.total_qty, 0);

  return (
    <div className="min-h-screen bg-[#3b0008] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-50 mb-2">
            📋 Thống Kê Chi Tiết Đơn Hàng
          </h1>
          <p className="text-amber-200/70">
            Xem chi tiết tham gia hoạt động theo từng đơn hàng
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-6">
            <p className="text-amber-200/70 text-sm mb-2">Đơn hàng</p>
            <p className="text-3xl font-bold text-amber-50">{stats.length}</p>
          </Card>
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-6">
            <p className="text-amber-200/70 text-sm mb-2">Tham gia (Thành viên)</p>
            <p className="text-3xl font-bold text-green-400">{totalAllMembers}</p>
          </Card>
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-6">
            <p className="text-amber-200/70 text-sm mb-2">Tham gia (Khách mời)</p>
            <p className="text-3xl font-bold text-blue-400">{totalAllNonMembers}</p>
          </Card>
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-6">
            <p className="text-amber-200/70 text-sm mb-2">Tổng tham gia</p>
            <p className="text-3xl font-bold text-amber-400">{totalAllQty}</p>
          </Card>
        </div>

        {/* Search & Export */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm mã đơn, tên, hoặc chapter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-[#2a0006]/50 border border-[#8b1c1f]/50 rounded-lg text-amber-50 placeholder-amber-200/50"
          />
          <Button
            onClick={exportToCSV}
            className="bg-amber-600 hover:bg-amber-700 text-amber-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Xuất CSV
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-500/50 bg-red-950/30 p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-8 text-center">
            <p className="text-amber-200">Đang tải dữ liệu...</p>
          </Card>
        )}

        {/* Orders List */}
        {!loading && filteredStats.length > 0 && (
          <div className="space-y-4">
            {filteredStats.map((order) => (
              <Card
                key={order.order_id}
                className="border-[#8b1c1f]/50 bg-[#2a0006]/50 overflow-hidden cursor-pointer hover:bg-[#2a0006]/70 transition"
                onClick={() =>
                  setExpandedOrder(
                    expandedOrder === order.order_id ? null : order.order_id
                  )
                }
              >
                {/* Order Header */}
                <div className="p-6 border-b border-[#8b1c1f]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="bg-amber-600/30 border border-amber-600/50 rounded px-3 py-1">
                          <p className="text-amber-200 font-mono font-bold text-sm">
                            {order.order_code}
                          </p>
                        </div>
                        <p className="text-amber-200/70 text-xs">
                          {new Date(order.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-amber-200/50 text-xs mb-1">
                            Người đăng ký
                          </p>
                          <p className="text-amber-50 font-medium">
                            {order.full_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-amber-200/50 text-xs mb-1">
                            Chapter
                          </p>
                          <p className="text-amber-50 font-medium">
                            {order.unit_name || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-amber-200/50 text-xs mb-1">
                            Chức vụ
                          </p>
                          <p className="text-amber-50 font-medium">
                            {order.title || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-amber-200/50 text-xs mb-1">
                            Tổng tham gia
                          </p>
                          <div className="flex gap-2">
                            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-semibold">
                              👤 {order.total_member_qty}
                            </span>
                            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-semibold">
                              👥 {order.total_non_member_qty}
                            </span>
                            <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded text-xs font-semibold">
                              ∑ {order.total_qty}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {expandedOrder === order.order_id ? (
                        <ChevronUp className="w-5 h-5 text-amber-200" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-amber-200" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Details (Expandable) */}
                {expandedOrder === order.order_id && (
                  <div className="p-6 bg-black/20 border-t border-[#8b1c1f]/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Member Activities */}
                      <div>
                        <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                          <span>👤 Tham gia Thành viên</span>
                          <span className="bg-green-500/20 px-2 py-1 rounded text-xs">
                            {order.total_member_qty}
                          </span>
                        </h4>
                        {order.member_activities &&
                        order.member_activities.length > 0 ? (
                          <div className="space-y-2">
                            {order.member_activities.map((activity, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center bg-[#1a0004]/50 p-3 rounded border border-green-500/20"
                              >
                                <span className="text-amber-50 text-sm">
                                  {activity.activity}
                                </span>
                                <span className="bg-green-500/30 text-green-300 px-2 py-1 rounded text-xs font-semibold">
                                  x{activity.qty}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-amber-200/50 text-sm">
                            Không có hoạt động
                          </p>
                        )}
                      </div>

                      {/* Non-Member Activities */}
                      <div>
                        <h4 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                          <span>👥 Tham gia Khách mời</span>
                          <span className="bg-blue-500/20 px-2 py-1 rounded text-xs">
                            {order.total_non_member_qty}
                          </span>
                        </h4>
                        {order.non_member_activities &&
                        order.non_member_activities.length > 0 ? (
                          <div className="space-y-2">
                            {order.non_member_activities.map(
                              (activity, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center bg-[#1a0004]/50 p-3 rounded border border-blue-500/20"
                                >
                                  <span className="text-amber-50 text-sm">
                                    {activity.activity}
                                  </span>
                                  <span className="bg-blue-500/30 text-blue-300 px-2 py-1 rounded text-xs font-semibold">
                                    x{activity.qty}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-amber-200/50 text-sm">
                            Không có hoạt động
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredStats.length === 0 && !error && (
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-8 text-center">
            <p className="text-amber-200">
              {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu thống kê'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
