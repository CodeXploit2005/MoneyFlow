/**
 * Date and Time utilities for Vietnam Timezone (Asia/Ho_Chi_Minh)
 */

export const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

export const getNowVietnam = () => {
  return new Date();
};

const DAY = 86400000;
const OFFSET = 7 * 3600000;
export const vietnamDate = (date = new Date()) => new Date(new Date(date).getTime() + OFFSET);
const fromVietnam = (date: Date) => new Date(date.getTime() - OFFSET);
export const addDays = (date, days) => new Date(new Date(date).getTime() + Number(days) * DAY);
export const startOfDayVN = (date = new Date()) => {
  const d = vietnamDate(date); d.setUTCHours(0, 0, 0, 0); return fromVietnam(d);
};
export const endOfDayVN = (date = new Date()) => new Date(startOfDayVN(date).getTime() + DAY - 1);
export const getStartOfWeekVN = (date = new Date()) => {
  const d = vietnamDate(date); return addDays(startOfDayVN(date), -(d.getUTCDay() + 6) % 7);
};
export const getStartOfMonthVN = (date = new Date()) => {
  const d = vietnamDate(date); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - OFFSET);
};
export const getEndOfMonthVN = (date = new Date()) => {
  const d = vietnamDate(date); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - OFFSET - 1);
};
export const getStartOfYearVN = (date = new Date()) => {
  const d = vietnamDate(date); return new Date(Date.UTC(d.getUTCFullYear(), 0, 1) - OFFSET);
};

/**
 * Tính số ngày chênh lệch giữa ngày hiện tại và ngày hết hạn
 * @param {Date} endDate 
 * @param {Date} [currentDate]
 * @returns {number} Số ngày còn lại (làm tròn số nguyên)
 */
export const getDaysRemaining = (endDate, currentDate = new Date()) => {
  const target = startOfDayVN(new Date(endDate)).getTime();
  const now = startOfDayVN(new Date(currentDate)).getTime();
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Xác định trạng thái bảo hành
 * - 'expired': Hết hạn (< 0 ngày)
 * - 'expiring_soon': Sắp hết hạn trong vòng 3 ngày (0 <= days <= 3)
 * - 'active': Còn bảo hành (> 3 ngày)
 */
export const determineWarrantyStatus = (endDate, currentDate = new Date()) => {
  const remaining = getDaysRemaining(endDate, currentDate);
  if (remaining < 0) return 'expired';
  if (remaining <= 3) return 'expiring_soon';
  return 'active';
};
