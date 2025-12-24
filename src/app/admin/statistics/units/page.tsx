'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/utils/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp } from 'lucide-react';

interface UnitStats {
  unit_id: string;
  unit_name: string;
  member_count: number;
  non_member_count: number;
  total_participants: number;
}

export default function UnitsStatisticsPage() {
  const [stats, setStats] = useState<UnitStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseClient();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc(
        'get_units_statistics'
      );

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      // Sort by total participants descending
      const sortedData = (data || []).sort(
        (a: UnitStats, b: UnitStats) => b.total_participants - a.total_participants
      );
      setStats(sortedData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu thống kê'
      );
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Chapter/Đơn vị',
      'Thành viên',
      'Khách mời',
      'Tổng cộng',
      'Tỷ lệ thành viên',
    ];
    const rows = stats.map((item) => {
      const percentage =
        item.total_participants > 0
          ? ((item.member_count / item.total_participants) * 100).toFixed(1)
          : '0';
      return [
        item.unit_name,
        item.member_count,
        item.non_member_count,
        item.total_participants,
        `${percentage}%`,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `units-statistics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalMembers = stats.reduce((sum, s) => sum + s.member_count, 0);
  const totalNonMembers = stats.reduce((sum, s) => sum + s.non_member_count, 0);
  const totalAll = stats.reduce((sum, s) => sum + s.total_participants, 0);

  return (
    <div className="min-h-screen bg-[#3b0008] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-50 mb-2">
            🏛️ Thống Kê Chapter / Đơn Vị
          </h1>
          <p className="text-amber-200/70">Phân tích số lượng tham gia theo từng chapter</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-6">
            <p className="text-amber-200/70 text-sm mb-2">Chapter</p>
            <p className="text-3xl font-bold text-amber-50">{stats.length}</p>
          </Card>
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-6">
            <p className="text-amber-200/70 text-sm mb-2">Thành viên</p>
            <p className="text-3xl font-bold text-green-400">{totalMembers}</p>
          </Card>
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-6">
            <p className="text-amber-200/70 text-sm mb-2">Khách mời</p>
            <p className="text-3xl font-bold text-blue-400">{totalNonMembers}</p>
          </Card>
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-6">
            <p className="text-amber-200/70 text-sm mb-2">Tổng cộng</p>
            <p className="text-3xl font-bold text-amber-400">{totalAll}</p>
          </Card>
        </div>

        {/* Export Button */}
        <div className="mb-6">
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

        {/* Statistics Table */}
        {!loading && stats.length > 0 && (
          <Card className="border-[#8b1c1f]/50 bg-black/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/20 border-b border-[#8b1c1f]/50">
                    <th className="px-6 py-4 text-left text-amber-200 font-semibold">
                      STT
                    </th>
                    <th className="px-6 py-4 text-left text-amber-200 font-semibold">
                      Chapter / Đơn Vị
                    </th>
                    <th className="px-6 py-4 text-center text-amber-200 font-semibold">
                      👤 Thành viên
                    </th>
                    <th className="px-6 py-4 text-center text-amber-200 font-semibold">
                      👥 Khách mời
                    </th>
                    <th className="px-6 py-4 text-center text-amber-200 font-semibold">
                      ∑ Tổng cộng
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((item, idx) => {
                    const percentage =
                      item.total_participants > 0
                        ? ((item.member_count / item.total_participants) * 100).toFixed(1)
                        : '0';

                    return (
                      <tr
                        key={item.unit_id}
                        className="border-b border-[#8b1c1f]/30 hover:bg-[#2a0006]/50 transition"
                      >
                        <td className="px-6 py-4 text-amber-200/70">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4 text-amber-50 font-medium">
                          {item.unit_name}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                            {item.member_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                            {item.non_member_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold">
                            {item.total_participants}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && stats.length === 0 && !error && (
          <Card className="border-[#8b1c1f]/50 bg-[#2a0006]/90 p-8 text-center">
            <p className="text-amber-200">Chưa có dữ liệu thống kê</p>
          </Card>
        )}
      </div>
    </div>
  );
}
