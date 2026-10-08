import React from 'react';

/**
 * Component Skeleton hiệu ứng tải trang mượt mà
 */
export const Skeleton = ({ className = '', rounded = 'rounded-xl', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 ${rounded} ${className}`}
      {...props}
    />
  );
};

export const StatCardSkeleton = () => {
  return (
    <div className="rounded-2xl border bg-white dark:bg-[#151C2C] border-[#E5E7EB] dark:border-[#243044] p-5 flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-2.5 w-2/5" />
      </div>
    </div>
  );
};

export const ChartCardSkeleton = () => {
  return (
    <div className="rounded-2xl border bg-white dark:bg-[#151C2C] border-[#E5E7EB] dark:border-[#243044] p-5 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-60 w-full rounded-xl" />
    </div>
  );
};

export default Skeleton;
