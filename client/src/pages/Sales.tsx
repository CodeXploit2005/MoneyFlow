import { PaymentStatusPicker } from '../components/ui/PaymentStatusPicker';
import React, { useState, useEffect } from 'react';
import { useGroupStore } from '../store/groupStore';
import { useAuthStore } from '../store/authStore';
import { saleApi } from '../api/endpoints';
import { SaleFormModal } from '../components/sales/SaleFormModal';
import { SaleNotes } from '../components/sales/SaleNotes';
import { RenewModal } from '../components/warranty/RenewModal';
import { ClaimModal } from '../components/warranty/ClaimModal';
import { VietQRModal } from '../components/ui/VietQRModal';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { MoneyInput } from '../components/ui/MoneyInput';
import { Badge } from '../components/ui/Badge';
import { formatVND, formatDate, formatWarrantyTime } from '../utils/format';
import {
  Plus,
  Search,
  QrCode,
  ShieldAlert,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { Sale } from '../types';

export const Sales: React.FC = () => {
  const { user } = useAuthStore();
  const { activeGroupId, myRoleInActiveGroup } = useGroupStore();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [keyword, setKeyword] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [renewSale, setRenewSale] = useState<Sale | null>(null);
  const [claimSale, setClaimSale] = useState<Sale | null>(null);
  const [qrSale, setQrSale] = useState<Sale | null>(null);

  // Pay modal
  const [paySale, setPaySale] = useState<Sale | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payError, setPayError] = useState('');
  const [payLoading, setPayLoading] = useState<boolean>(false);

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await saleApi.getAll({
        groupId: activeGroupId || undefined,
        keyword: keyword || undefined,
        paymentStatus: paymentStatus || undefined
      });
      setSales(res.data?.sales || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [activeGroupId, keyword, paymentStatus]);

  useEffect(() => {
    const refresh = () => { void loadSales(); };
    window.addEventListener('moneyflow:data-changed', refresh);
    return () => window.removeEventListener('moneyflow:data-changed', refresh);
  }, [activeGroupId, keyword, paymentStatus]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySale || payAmount <= 0) return;

    if (payAmount > paySale.price * paySale.quantity - (paySale.paidAmount || 0)) { setPayError('Số tiền vượt quá số tiền còn phải thu'); return; }
    setPayError('');
    setPayLoading(true);
    try {
      await saleApi.recordPayment(paySale._id, { amount: payAmount });
      setPaySale(null);
      loadSales();
    } catch (err: any) {
      setPayError(err.message);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Quản Lý Bán Hàng & Đơn Hàng
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Theo dõi đơn bán, giá vốn, lãi gộp và tình trạng thanh toán
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Tạo đơn bán mới
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            aria-label="Tìm đơn bán"
            placeholder="Tìm theo tên sản phẩm, thông tin bàn giao..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full min-h-11 pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-base sm:text-sm bg-white dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div className="w-full sm:w-64 sm:shrink-0"><PaymentStatusPicker value={paymentStatus} onChange={setPaymentStatus} includeAll /></div>
      </div>

      {/* Sales List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Đang tải danh sách đơn bán...</div>
        ) : sales.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">Chưa có đơn bán hàng nào</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sales.map((sale) => {
              const totalAmount = sale.price * sale.quantity;
              const wInfo = formatWarrantyTime(sale.warrantyEnd);
              const custName = typeof sale.customerId === 'object' ? sale.customerId?.name : 'Khách lẻ';
              const custPhone = typeof sale.customerId === 'object' ? sale.customerId?.phone : '';
              const creatorId = typeof sale.ownerId === 'object' ? sale.ownerId?._id : sale.ownerId;
              const canEdit = !activeGroupId || creatorId === user?._id || ['owner', 'admin'].includes(myRoleInActiveGroup || '');
              const ownerName = typeof sale.ownerId === 'object' ? sale.ownerId?.name : 'Tôi';

              return (
                <div key={sale._id} className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                          {sale.quantity > 1 ? `${sale.quantity}x ` : ''}{sale.productName}
                        </span>

                        {/* Payment Badge */}
                        <Badge variant={sale.paymentStatus === 'paid' ? 'success' : (sale.paymentStatus === 'partial' ? 'warning' : 'danger')}>
                          {sale.paymentStatus === 'paid' ? 'Đã thanh toán' : (sale.paymentStatus === 'partial' ? 'Trả 1 phần' : 'Chưa trả')}
                        </Badge>

                        {/* Warranty Badge */}
                        <Badge variant={wInfo.status === 'active' ? 'success' : (wInfo.status === 'expiring_soon' ? 'warning' : 'danger')}>
                          {wInfo.text}
                        </Badge>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Khách: <strong className="text-slate-700 dark:text-slate-300">{custName}</strong></span>
                        {custPhone && <span>SĐT/Zalo: {custPhone}</span>}
                        <span>Ngày bán: {formatDate(sale.soldAt)}</span>
                        <span>Người bán: {ownerName}</span>
                      </div>

                      {sale.notes && <SaleNotes notes={sale.notes} productName={sale.productName} customerName={custName || 'Khách'} />}
                    </div>

                    {/* Right Price & Actions */}
                    <div className="flex flex-col items-stretch sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {formatVND(totalAmount)}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          Lãi gộp: {sale.profit > 0 ? '+' : ''}{formatVND(sale.profit)}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {canEdit && sale.status !== 'void' && sale.paymentStatus !== 'paid' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setPayError('');
                              setPaySale(sale);
                              setPayAmount(totalAmount - (sale.paidAmount || 0));
                            }}
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1" />
                            Thu tiền
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQrSale(sale)}
                          aria-label="Tạo VietQR"
                          className="min-w-[44px]"
                          title="Tạo VietQR"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canEdit || sale.status === 'void'}
                          onClick={() => setRenewSale(sale)}
                          aria-label="Gia hạn bảo hành"
                          className="min-w-[44px]"
                          title="Gia hạn bảo hành"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canEdit || sale.status === 'void'}
                          onClick={() => setClaimSale(sale)}
                          aria-label="Ghi nhận bảo hành / đổi"
                          className="min-w-[44px]"
                          title="Ghi nhận bảo hành / đổi"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sale Form Modal */}
      <SaleFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadSales}
      />

      {/* Renew Modal */}
      <RenewModal
        isOpen={!!renewSale}
        onClose={() => setRenewSale(null)}
        sale={renewSale}
        onSuccess={loadSales}
      />

      {/* Claim Modal */}
      <ClaimModal
        isOpen={!!claimSale}
        onClose={() => setClaimSale(null)}
        sale={claimSale}
        onSuccess={loadSales}
      />

      {/* Record Payment Modal */}
      {paySale && (
        <Modal isOpen={!!paySale} onClose={() => setPaySale(null)} title="Ghi nhận thu tiền đơn hàng" maxWidth="max-w-md">
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm">
              <div className="font-bold">{paySale.productName}</div>
              <div className="text-xs text-slate-500">Khách: {typeof paySale.customerId === 'object' ? paySale.customerId?.name : 'Khách lẻ'}</div>
            </div>

            <p className="text-sm text-slate-500">Còn phải thu: <strong>{formatVND(paySale.price * paySale.quantity - (paySale.paidAmount || 0))}</strong></p>
            {payError && <p role="alert" className="text-sm text-rose-500">{payError}</p>}
            <MoneyInput
              label="Số tiền khách trả đợt này (VNĐ)"
              value={payAmount}
              onChange={setPayAmount}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setPaySale(null)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" isLoading={payLoading}>
                Xác nhận thu
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* VietQR Modal */}
      {qrSale && (
        <VietQRModal
          isOpen={!!qrSale}
          onClose={() => setQrSale(null)}
          bankInfo={user?.bankInfo}
          amount={qrSale.paymentStatus === 'paid' ? qrSale.price * qrSale.quantity : Math.max(0, qrSale.price * qrSale.quantity - (qrSale.paidAmount || 0))}
          description={`MF-SALE-${qrSale.productName.slice(0, 10).toUpperCase().replace(/\s+/g, '')}`}
          title="Mã VietQR Thanh Toán Đơn Hàng"
        />
      )}
    </div>
  );
};

