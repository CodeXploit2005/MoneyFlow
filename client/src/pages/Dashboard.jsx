import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { CashflowChart } from '../components/charts/CashflowChart';
import { ExpenseDonut } from '../components/charts/ExpenseDonut';
import { StatCardSkeleton, ChartCardSkeleton } from '../components/ui/Skeleton';
import { TransactionFormModal } from '../components/transactions/TransactionFormModal';
import { formatMoney } from '../utils/formatMoney';
import { reportApi, categoryApi } from '../api/endpoints';
import { useGroupStore } from '../store/groupStore';
import { useTheme } from '../hooks/useTheme';
import { useReportPeriodStore } from '../store/reportPeriodStore';

/**
 * Trang Dashboard: "Tổng quan tài chính"
 * Thiết kế chuẩn xác 100% theo hệ thống thiết kế MoneyFlow
 */
export const Dashboard = () => {
  const { activeGroupId } = useGroupStore();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const { selectedMonth, setSelectedMonth } = useReportPeriodStore();
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [includeCogs, setIncludeCogs] = useState(true);

  // Dữ liệu tổng quan
  const [overview, setOverview] = useState({
    income: 0,
    expense: 0,
    profit: 0,
    warrantyActive: 0,
    warrantyExpiring: 0
  });

  const [dailyData, setDailyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  // Tải dữ liệu từ API
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [, month, year] = selectedMonth.match(/Tháng (\d+), (\d+)/);
      const params = { groupId: activeGroupId || undefined, month: Number(month), year: Number(year) };
      const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1) - 7 * 3600000).toISOString();
      const endDate = new Date(Date.UTC(Number(year), Number(month), 1) - 7 * 3600000 - 1).toISOString();
      const [ovRes, dailyRes, catRes] = await Promise.all([
        reportApi.getOverview(params),
        reportApi.getDailyChart(params),
        categoryApi.getBreakdown({
          groupId: activeGroupId || undefined,
          startDate, endDate, excludeCogs: (!includeCogs).toString()
        })
      ]);

      const monthData = ovRes.data?.month || {};
      const warrantyData = ovRes.data?.warranty || {};

      setOverview({
        income: monthData.income || 0,
        expense: monthData.expense || 0,
        profit: monthData.profit || 0,
        warrantyActive: warrantyData.activeCount || 0,
        warrantyExpiring: warrantyData.expiringSoonCount || 0
      });

      setDailyData(dailyRes.data || []);
      const cats = catRes.data?.categories || [];
      setCategoryData(cats.map(item => ({...item, name: item.categoryName, percent: item.percentage})));
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu tổng quan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeGroupId, includeCogs, selectedMonth]);

  const handleExportReport = () => {
    const [, month, year] = selectedMonth.match(/Tháng (\d+), (\d+)/);
    const url = reportApi.getExportUrl({ groupId: activeGroupId || '', startDate: `${year}-${month.padStart(2,'0')}-01`, endDate: `${year}-${month.padStart(2,'0')}-${new Date(Date.UTC(Number(year),Number(month),0)).getUTCDate()}` });
    window.open(url, '_blank');
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => { const d = new Date(Date.now() + 7 * 3600000); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i); return `Tháng ${d.getUTCMonth() + 1}, ${d.getUTCFullYear()}`; });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Hàng tiêu đề: Tiêu đề lớn + Ô chọn tháng & Nút Xuất báo cáo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">
            Tổng quan tài chính
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            Theo dõi thu chi và hoạt động kinh doanh của bạn
          </p>
        </div>

        {/* Cụm công cụ bên phải */}
        <div className="flex items-center gap-2.5">
          {/* Ô chọn tháng dạng dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#151C2C] border border-[#E5E7EB] dark:border-[#243044] text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9] hover:border-slate-300 dark:hover:border-slate-600 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
              <span>{selectedMonth}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showMonthDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl bg-white dark:bg-[#151C2C] border border-slate-200 dark:border-[#243044] shadow-xl p-1.5 space-y-1 z-30 text-xs">
                {monthOptions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(m);
                      setShowMonthDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl font-medium transition ${
                      selectedMonth === m
                        ? 'bg-emerald-50 text-[#059669] dark:bg-emerald-950/40 dark:text-[#34D399] font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nút "Xuất báo cáo" viền xanh lục, chữ xanh lục */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
            className="rounded-xl px-3.5 py-2 font-medium"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 stroke-[2.2]" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* 2. Hàng 4 thẻ thống kê (StatCard): Lưới 4 cột trên desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Thẻ 1: Tổng thu */}
            <StatCard
              title="Tổng thu"
              value={formatMoney(overview.income)}
              subtitle={selectedMonth}
              icon={ArrowUpRight}
              variant="income"
            />

            {/* Thẻ 2: Tổng chi */}
            <StatCard
              title="Tổng chi"
              value={formatMoney(overview.expense)}
              subtitle="Trong tháng này"
              icon={ArrowDownLeft}
              variant="expense"
            />

            {/* Thẻ 3: Lãi ròng */}
            <StatCard
              title="Chênh lệch thu chi"
              value={formatMoney(overview.profit)}
              subtitle="Trong tháng này"
              icon={TrendingUp}
              variant="profit"
            />

            {/* Thẻ 4: Bảo hành đang chạy */}
            <StatCard
              title="Bảo hành đang chạy"
              value={String(overview.warrantyActive)}
              subtitle={
                overview.warrantyActive === 0
                  ? 'Chưa có đơn bảo hành'
                  : overview.warrantyExpiring > 0
                  ? `${overview.warrantyExpiring} đơn sắp hết hạn`
                  : 'Tất cả đơn đều ổn định'
              }
              icon={ShieldCheck}
              variant="warranty"
            />
          </>
        )}
      </div>

      {/* 3. Hàng biểu đồ: Biểu đồ đường (2/3) + Biểu đồ donut (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {loading ? (
          <>
            <div className="lg:col-span-2">
              <ChartCardSkeleton />
            </div>
            <div className="lg:col-span-1">
              <ChartCardSkeleton />
            </div>
          </>
        ) : (
          <>
            {/* Card "Dòng tiền trong tháng" (chiếm 2/3) */}
            <div className="lg:col-span-2">
              <CashflowChart
                data={dailyData}
                isDark={isDark}
                onAddTransaction={() => setShowTransactionModal(true)}
              />
            </div>

            {/* Card "Cơ cấu chi tiêu" (chiếm 1/3) */}
            <div className="lg:col-span-1">
              <ExpenseDonut
                data={categoryData}
                isDark={isDark}
                includeCogs={includeCogs}
                onToggleCogs={setIncludeCogs}
              />
            </div>
          </>
        )}
      </div>

      {/* Modal Thêm giao dịch nhanh khi người dùng click nút "Thêm giao dịch" trên biểu đồ rỗng */}
      <TransactionFormModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSuccess={loadDashboardData}
        defaultType="income"
      />
    </div>
  );
};

export default Dashboard;
