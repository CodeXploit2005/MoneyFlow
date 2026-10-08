import React from 'react';

/**
 * Component Button linh hoạt cho MoneyFlow
 * Hỗ trợ các variant: primary (xanh lục), outline (viền xanh), secondary, ghost, danger
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  type = 'button',
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] select-none disabled:opacity-50 disabled:pointer-events-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-2 min-h-[44px] sm:min-h-[36px] gap-1.5',
    md: 'text-sm px-4 py-2 min-h-[44px] gap-2',
    lg: 'text-base px-5 py-2.5 min-h-[44px] gap-2.5 font-semibold',
    icon: 'p-2 min-h-[44px] min-w-[44px] rounded-xl'
  };

  const variantStyles = {
    // Nút chính xanh lục đặc trưng MoneyFlow
    primary: 'bg-[#10B981] hover:bg-[#059669] text-white shadow-sm shadow-emerald-500/20 dark:bg-[#10B981] dark:hover:bg-[#059669]',
    
    // Nút viền xanh lục như nút "Xuất báo cáo" trong ảnh tham chiếu
    outline: 'border border-[#10B981] text-[#059669] dark:text-[#34D399] dark:border-[#10B981]/50 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
    
    // Nút phụ nền xám nhạt / tối
    secondary: 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0] dark:bg-[#1E293B] dark:text-[#E2E8F0] dark:hover:bg-[#334155]',
    
    // Nút viền xám cơ bản
    border: 'border border-[#E5E7EB] dark:border-[#243044] text-[#334155] dark:text-[#E2E8F0] bg-white dark:bg-[#151C2C] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]',
    
    // Nút ghost không viền
    ghost: 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 dark:text-[#94A3B8] dark:hover:text-[#F1F5F9] dark:hover:bg-slate-800/60',
    
    // Nút đỏ
    danger: 'bg-[#F43F5E] hover:bg-[#E11D48] text-white shadow-sm shadow-rose-500/20'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
