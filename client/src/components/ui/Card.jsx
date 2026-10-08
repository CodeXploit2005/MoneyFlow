import React from 'react';

/**
 * Component Card theo hệ thống thiết kế MoneyFlow
 * Bo góc lớn (rounded-2xl), viền mảnh #E5E7EB (light) / #243044 (dark)
 * Nền trắng ở light mode, nền #151C2C nổi bật ở dark mode
 */
export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerBorder = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-[#151C2C] border-[#E5E7EB] dark:border-[#243044] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none transition-colors duration-200 ${className}`}
      {...props}
    >
      {(title || action) && (
        <div
          className={`flex items-center justify-between p-5 pb-3 ${
            headerBorder ? 'border-b border-[#E5E7EB] dark:border-[#243044]' : ''
          }`}
        >
          <div>
            {title && (
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={title ? 'p-5 pt-0' : 'p-5'}>{children}</div>
    </div>
  );
};

export default Card;
