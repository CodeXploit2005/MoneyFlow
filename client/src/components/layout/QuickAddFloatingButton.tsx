import React, { useState } from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, ShoppingBag } from 'lucide-react';

interface QuickAddFloatingButtonProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddSale: () => void;
}

export const QuickAddFloatingButton: React.FC<QuickAddFloatingButtonProps> = ({
  onAddIncome,
  onAddExpense,
  onAddSale
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 lg:bottom-8 right-5 z-40 flex flex-col items-end gap-2.5">
      {/* Sub Action Buttons */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2 animate-fade-in">
          {/* Tạo đơn bán */}
          <button
            onClick={() => {
              setIsOpen(false);
              onAddSale();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg text-sm font-semibold transition active:scale-95"
          >
            <span>Tạo đơn bán & bảo hành</span>
            <div className="p-1 rounded-xl bg-white/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </button>

          {/* Ghi khoản Chi */}
          <button
            onClick={() => {
              setIsOpen(false);
              onAddExpense();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg text-sm font-semibold transition active:scale-95"
          >
            <span>Ghi khoản Chi (-)</span>
            <div className="p-1 rounded-xl bg-white/20">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </button>

          {/* Ghi khoản Thu */}
          <button
            onClick={() => {
              setIsOpen(false);
              onAddIncome();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg text-sm font-semibold transition active:scale-95"
          >
            <span>Ghi khoản Thu (+)</span>
            <div className="p-1 rounded-xl bg-white/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-300 active:scale-90 ${
          isOpen
            ? 'bg-slate-800 rotate-45 dark:bg-slate-700'
            : 'bg-gradient-to-tr from-emerald-600 to-teal-400 hover:shadow-emerald-500/30'
        }`}
        title="Thêm nhanh"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
};
