import React, { useState, useEffect } from 'react';
import { useGroupStore } from '../store/groupStore';
import { reportApi, categoryApi } from '../api/endpoints';
import { useReportPeriodStore } from '../store/reportPeriodStore';
import { OptionPicker } from '../components/ui/OptionPicker';
import { IncomeExpenseChart, ChartDayItem } from '../components/charts/IncomeExpenseChart';
import { CategoryPieChart, CategoryPieItem } from '../components/charts/CategoryPieChart';
import { TopProductsCard, TopProductItem } from '../components/charts/TopProductsCard';
import { Button } from '../components/ui/Button';
import { formatVND } from '../utils/format';
import { PieChart, Download } from 'lucide-react';

export const Reports: React.FC = () => {
  const { activeGroupId } = useGroupStore();
  const { selectedMonth, setSelectedMonth } = useReportPeriodStore();
  const [, selectedMonthNumber, selectedYear] = selectedMonth.match(/Tháng (\d+), (\d+)/)!;
  const startDate = `${selectedYear}-${selectedMonthNumber.padStart(2,'0')}-01`;
  const endDate = `${selectedYear}-${selectedMonthNumber.padStart(2,'0')}-${new Date(Date.UTC(Number(selectedYear),Number(selectedMonthNumber),0)).getUTCDate()}`;

  const [overview, setOverview] = useState<any>(null);
  const [dailyChart, setDailyChart] = useState<ChartDayItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryPieItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { groupId: activeGroupId || undefined, month: Number(selectedMonthNumber), year: Number(selectedYear), startDate, endDate };
      const [ovRes, dRes, cRes, tRes] = await Promise.all([
        reportApi.getOverview(params),
        reportApi.getDailyChart(params),
        categoryApi.getBreakdown({...params, excludeCogs: 'false'}),
        reportApi.getTopProducts(params)
      ]);

      setOverview(ovRes.data);
      setDailyChart(dRes.data || []);
      setCategoryData(cRes.data?.categories || []);
      setTopProducts(tRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeGroupId, selectedMonth]);

  const handleExport = () => {
    const url = reportApi.getExportUrl({ groupId: activeGroupId || '', startDate, endDate });
    window.open(url, '_blank');
  };

  if (loading) {
    return <div className="py-24 text-center text-xs text-slate-400">Đang xuất báo cáo tài chính...</div>;
  }

  const month = overview?.month || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Báo Cáo & Phân Tích Tài Chính</span>
            <PieChart className="w-6 h-6 text-emerald-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tổng quan hiệu suất bán hàng, biên lợi nhuận và xuất dữ liệu báo cáo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2"><div className="w-48"><OptionPicker label="Chọn tháng báo cáo" value={selectedMonth} onChange={setSelectedMonth} options={Array.from({length:12},(_,i)=>{const d=new Date(Date.now()+7*3600000);d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()-i);const value=`Tháng ${d.getUTCMonth()+1}, ${d.getUTCFullYear()}`;return {value,label:value};})} /></div><Button variant="primary" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-1.5" />
          Tải file CSV Excel
        </Button></div>
      </div>

      {/* Monthly Financial Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng thu · {selectedMonth}</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatVND(month.income)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {month.incomeGrowth == null ? 'Tháng trước chưa có thu để so sánh' : <>So với tháng trước: <strong className={month.incomeGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{month.incomeGrowth}%</strong></>}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng chi · {selectedMonth}</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatVND(month.expense)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {month.expenseGrowth == null ? 'Tháng trước chưa có chi để so sánh' : <>So với tháng trước: <strong className={month.expenseGrowth <= 0 ? 'text-emerald-600' : 'text-rose-600'}>{month.expenseGrowth}%</strong></>}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chênh lệch thu chi tháng</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {formatVND(month.profit)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Tỷ lệ chênh lệch thu chi: <strong className="text-emerald-600">{month.income > 0 ? ((month.profit / month.income) * 100).toFixed(1) : 0}%</strong>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-base mb-4 text-slate-900 dark:text-slate-100">
            Dòng Tiền Thu Chi Hằng Ngày
          </h3>
          <IncomeExpenseChart data={dailyChart} />
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-base mb-4 text-slate-900 dark:text-slate-100">
            Cơ Cấu Chi Tiêu
          </h3>
          <CategoryPieChart data={categoryData} />
        </div>
      </div>

      {/* Top Products */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-base mb-4 text-slate-900 dark:text-slate-100">
          Hiệu Quả Kinh Doanh Từng Sản Phẩm
        </h3>
        <TopProductsCard products={topProducts} />
      </div>
    </div>
  );
};
