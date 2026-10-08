import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from './Button';

/**
 * Component EmptyState hiển thị trạng thái rỗng đẹp mắt
 * Dùng ở giữa biểu đồ khi chưa có giao dịch hoặc bảng danh sách rỗng
 */
export const EmptyState = ({
  icon: Icon = FileText,
  title = 'Chưa có giao dịch trong tháng',
  description = '',
  actionText = 'Thêm giao dịch',
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-6 ${className}`}>
      {/* Icon trong ô tròn */}
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>

      {/* Dòng chữ thông báo */}
      <p className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-3 max-w-xs">
        {title}
      </p>

      {description && (
        <p className="text-xs text-[#94A3B8] dark:text-[#64748B] mb-4 max-w-sm">
          {description}
        </p>
      )}

      {/* Nút hành động xanh lục */}
      {actionText && onAction && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          className="rounded-xl px-4 py-2 text-xs font-semibold"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
