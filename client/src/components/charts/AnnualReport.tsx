import { useEffect, useState } from 'react';
import { reportApi } from '../../api/endpoints';
import { formatVND } from '../../utils/format';

export function AnnualReport({ year, groupId }: { year: number; groupId: string | null }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setData(null);
    setError(false);
    reportApi.getAnnualSummary({ year, groupId: groupId || undefined }).then(res => {
      if (active) setData(res.data);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [year, groupId]);
  return <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
    <div>
      <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Tổng hợp cả năm {year}</h2>
      <p className="text-sm text-slate-500 mt-1">Cộng thu chi của 12 tháng. Tổng chi đã bao gồm giá vốn được ghi trong sổ thu chi.</p>
    </div>
    {error ? <p role="alert" className="text-rose-600">Không tải được tổng hợp năm. Vui lòng tải lại trang.</p> : !data ? <p className="text-slate-500">Đang tổng hợp dữ liệu năm...</p> : <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          ['Tổng thu cả năm', data.annual.income, 'text-emerald-600'],
          ['Tổng chi cả năm', data.annual.expense, 'text-rose-600'],
          ['Chênh lệch thu chi cả năm', data.annual.net, 'text-indigo-600']
        ].map(([label, value, color]) => <div key={String(label)} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className={`text-xl font-bold mt-2 ${color}`}>{formatVND(Number(value))}</p>
        </div>)}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap text-right">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500"><tr>{['Tháng', 'Tổng thu', 'Tổng chi', 'Chênh lệch thu chi'].map((label, i) => <th key={label} className={`p-3 ${i === 0 ? 'text-left' : ''}`}>{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{data.annual.months.map((m: any) => <tr key={m.month}>
            <td className="p-3 text-left text-slate-600 dark:text-slate-300">Tháng {Number(m.month.slice(5))}</td>
            <td className="p-3 text-emerald-600">{formatVND(m.income)}</td><td className="p-3 text-rose-600">{formatVND(m.expense)}</td><td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{formatVND(m.net)}</td>
          </tr>)}</tbody>
          <tfoot className="bg-emerald-50 dark:bg-emerald-950/40 font-bold text-slate-900 dark:text-slate-100"><tr><td className="p-3 text-left">Tổng năm {year}</td><td className="p-3">{formatVND(data.annual.income)}</td><td className="p-3">{formatVND(data.annual.expense)}</td><td className="p-3">{formatVND(data.annual.net)}</td></tr></tfoot>
        </table>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Tổng toàn thời gian</h3>
        <p className="text-xs text-slate-500 mt-1">Tất cả các năm trong ví hoặc nhóm đang chọn.</p>
        <div className="flex flex-wrap gap-x-8 gap-y-2 mt-3 text-sm text-slate-600 dark:text-slate-300">
          <span>Tổng thu: <strong className="text-emerald-600">{formatVND(data.allTime.income)}</strong></span>
          <span>Tổng chi: <strong className="text-rose-600">{formatVND(data.allTime.expense)}</strong></span>
          <span>Chênh lệch: <strong>{formatVND(data.allTime.net)}</strong></span>
        </div>
      </div>
    </>}
  </section>;
}
