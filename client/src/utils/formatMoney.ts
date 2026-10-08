/**
 * Định dạng số tiền kiểu Việt Nam chuẩn (ví dụ: "1.500.000 đ", "0 đ")
 * Sử dụng Intl.NumberFormat('vi-VN') theo yêu cầu thiết kế
 * @param {number|string} amount Số tiền cần định dạng
 * @returns {string} Chuỗi tiền tệ định dạng tiếng Việt kèm ký hiệu đ
 */
export const formatMoney = (amount: number | string | null | undefined): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0 đ';
  }

  const num = Math.round(Number(amount));
  
  // Định dạng theo chuẩn vi-VN
  const formatted = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0
  }).format(Math.abs(num));

  const sign = num < 0 ? '-' : '';
  return `${sign}${formatted} đ`;
};

/**
 * Định dạng rút gọn cho trục biểu đồ (ví dụ: "0 đ", "1 đ", "2 đ", "1 Tr", "500k")
 */
export const formatShortMoney = (amount: number | string | null | undefined): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0 đ';
  }
  const num = Math.round(Number(amount));
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)} Tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(0)} Tr`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)}k`;
  }
  return `${sign}${abs} đ`;
};

export default formatMoney;
