import React from 'react';

interface MoneyInputProps {
  label?: string;
  value: number;
  onChange: (val: number) => void;
  error?: string;
  className?: string;
  quickAmounts?: number[];
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  label = 'Số tiền (VNĐ)',
  value,
  onChange,
  error,
  className = '',
  quickAmounts = [50000, 100000, 200000, 500000, 1000000]
}) => {
  const formatDisplay = (val: number) => {
    if (!val && val !== 0) return '';
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    onChange(num);
  };

  const handleSetQuick = (amt: number) => {
    onChange(amt);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={value ? formatDisplay(value) : ''}
          onChange={handleChange}
          placeholder="0 ₫"
          className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold text-slate-900 transition-all placeholder:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 ${
            error ? 'border-rose-500' : ''
          } ${className}`}
        />
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-sm font-bold text-emerald-600 dark:text-emerald-400">
          ₫
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {quickAmounts.map((amt) => {
          const isSelected = value === amt;
          return (
            <button
              key={amt}
              type="button"
              onClick={() => handleSetQuick(amt)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105 ring-1 ring-emerald-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:scale-105 hover:shadow-sm dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80 dark:hover:text-emerald-400'
              }`}
            >
              {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>
      )}
    </div>
  );
};
