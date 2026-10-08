import { create } from 'zustand';

const now = new Date(Date.now() + 7 * 3600000);
export const useReportPeriodStore = create<{selectedMonth: string; setSelectedMonth: (month: string) => void}>((set) => ({
  selectedMonth: `Tháng ${now.getUTCMonth() + 1}, ${now.getUTCFullYear()}`,
  setSelectedMonth: selectedMonth => set({ selectedMonth })
}));
