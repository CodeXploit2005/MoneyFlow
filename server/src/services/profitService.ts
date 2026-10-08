export class ProfitService {
  /**
   * Tính lãi = (giá bán - giá vốn) * số lượng
   */
  static calculateProfit(price: number, cost: number, quantity: number = 1): number {
    const p = Math.round(Number(price) || 0);
    const c = Math.round(Number(cost) || 0);
    const q = Math.max(1, Math.round(Number(quantity) || 1));
    return (p - c) * q;
  }

  /**
   * Tính tỷ suất lợi nhuận (Margin %)
   */
  static calculateMargin(price: number, cost: number): number {
    const p = Number(price) || 0;
    const c = Number(cost) || 0;
    if (p <= 0) return 0;
    return Number((((p - c) / p) * 100).toFixed(2));
  }
}
export default ProfitService;
