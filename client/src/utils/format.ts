import { format, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

export const addDays = (date: Date | string | number, days: number | string): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + Number(days));
  return result;
};

/**
 * Định dạng tiền tệ VND chuẩn: 1.500.000 ₫
 */
export const formatVND = (amount?: number | null | string): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '0 ₫';
  const num = Math.round(Number(amount));
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(num);
};

/**
 * Định dạng rút gọn: 1.5 Tr, 250k
 */
export const formatShortVND = (amount?: number | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)} Tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)} Tr`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)}k`;
  }
  return `${sign}${abs} ₫`;
};

/**
 * Định dạng ngày giờ Việt Nam
 */
export const formatDate = (date?: Date | string | number | null, pattern: string = 'dd/MM/yyyy'): string => {
  if (!date) return '';
  const d = new Date(date);
  if (!isValid(d)) return '';
  return format(d, pattern, { locale: vi });
};

export const formatDateTime = (date?: Date | string | number | null): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Tính số ngày còn lại và hiển thị tiếng Việt
 */
export interface WarrantyTimeStatus {
  text: string;
  status: 'expired' | 'expiring_soon' | 'active';
  days: number;
}

export const formatWarrantyTime = (endDate?: string | Date | null): WarrantyTimeStatus => {
  if (!endDate) return { text: 'Không xác định', status: 'expired', days: 0 };
  const dayVN = (d: Date) => Math.floor((d.getTime() + 7 * 3600000) / 86400000) * 86400000;
  const target = dayVN(new Date(endDate));
  const now = dayVN(new Date());
  const days = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      text: `Quá hạn ${Math.abs(days)} ngày`,
      status: 'expired',
      days
    };
  }
  if (days === 0) {
    return {
      text: 'Hết hạn hôm nay',
      status: 'expiring_soon',
      days
    };
  }
  if (days <= 3) {
    return {
      text: `Còn ${days} ngày`,
      status: 'expiring_soon',
      days
    };
  }
  return {
    text: `Còn ${days} ngày`,
    status: 'active',
    days
  };
};

/**
 * Chuẩn hóa input số tiền khi người dùng gõ
 */
export const cleanMoneyInput = (value?: string | number): number => {
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
};
