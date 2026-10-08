import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && visible ? 'text' : type}
          className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 ${
            Icon ? 'pl-10' : ''
          } ${isPassword ? 'pr-12' : ''} ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''} ${className}`}
          {...props}
        />
        {isPassword && <button type="button" aria-label={visible ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'} aria-pressed={visible} aria-controls={inputId} onClick={() => setVisible(v => !v)} className="absolute inset-y-0 right-0 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-500 focus-visible:outline focus-visible:outline-emerald-500">
          {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>}
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-500 dark:text-rose-400 font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
