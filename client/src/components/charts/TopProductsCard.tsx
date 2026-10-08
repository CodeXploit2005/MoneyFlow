import React from 'react';
import { formatVND } from '../../utils/format';

export interface TopProductItem {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  totalProfit: number;
  margin: number | string;
}

interface TopProductsCardProps {
  products?: TopProductItem[];
}

export const TopProductsCard: React.FC<TopProductsCardProps> = ({ products = [] }) => {
  if (!products || products.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        Chưa có đơn bán hàng nào
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((p, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80"
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-extrabold text-xs">
              {idx + 1}
            </span>
            <div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate max-w-[150px] sm:max-w-[200px]">
                {p.productName}
              </div>
              <div className="text-xs text-slate-400">
                Đã bán: <span className="font-semibold text-slate-600 dark:text-slate-300">{p.totalQuantity}</span> | Doanh thu: {formatVND(p.totalRevenue)}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Lãi ròng</div>
            <div className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
              +{formatVND(p.totalProfit)}
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.5 rounded">
              +{p.margin}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
