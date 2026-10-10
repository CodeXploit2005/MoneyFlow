import { CustomerSearch } from '../customers/CustomerSearch';
import { PaymentStatusPicker } from '../ui/PaymentStatusPicker';
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MoneyInput } from '../ui/MoneyInput';
import { QuantityInput } from '../ui/QuantityInput';
import { VietQRModal } from '../ui/VietQRModal';
import { saleApi, customerApi } from '../../api/endpoints';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { formatVND, addDays, formatDate } from '../../utils/format';
import { QrCode, UserPlus, Sparkles, History, CreditCard, UserCheck } from 'lucide-react';
import { Customer } from '../../types';

interface SaleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SaleFormModal: React.FC<SaleFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const { activeGroupId } = useGroupStore();

  const [productName, setProductName] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [custLoading, setCustLoading] = useState<boolean>(false);
  const [isNewCustomer, setIsNewCustomer] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustZalo, setNewCustZalo] = useState<string>('');

  const [price, setPrice] = useState<number>(150000);
  const [cost, setCost] = useState<number>(50000);
  const [quantity, setQuantity] = useState<number>(1);
  const [soldAt, setSoldAt] = useState<string>(new Date(Date.now() + 7 * 3600000).toISOString().split('T')[0]);
  const [warrantyDays, setWarrantyDays] = useState<string>('30');
  const [paymentStatus, setPaymentStatus] = useState<string>('paid');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showQR, setShowQR] = useState<boolean>(false);

  const resetForm = () => {
    setProductName('');
    setCustomerId('');
    setCustomers([]);
    setIsNewCustomer(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustZalo('');
    setPrice(150000);
    setCost(50000);
    setQuantity(1);
    setSoldAt(new Date().toISOString().split('T')[0]);
    setWarrantyDays('30');
    setPaymentStatus('paid');
    setPaidAmount(0);
    setNotes('');
    setError('');
    setCustomerDetail(null);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, activeGroupId]);

  // Tự động tải dữ liệu đồng bộ từ Sổ Thu Chi khi chọn khách hàng có sẵn
  useEffect(() => {
    let current = true;
    setCustomerDetail(null);
    if (customerId && !isNewCustomer) {
      setCustLoading(true);
      customerApi.getById(customerId)
        .then((res: any) => {
          if (current) setCustomerDetail(res.data);
        })
        .catch((e) => console.error('Lỗi lấy chi tiết khách hàng:', e))
        .finally(() => { if (current) setCustLoading(false); });
    } else {
      setCustomerDetail(null);
    }
    return () => { current = false; };
  }, [customerId, isNewCustomer]);

  // Tự động tính toán ngày hết hạn
  const calcWarrantyEnd = () => {
    const start = new Date(soldAt);
    if (!warrantyDays) return 'Chưa nhập số ngày';
    const end = addDays(start, Number(warrantyDays));
    return formatDate(end, 'dd/MM/yyyy');
  };

  // Tự động tính lãi
  const totalRevenue = (Number(price) || 0) * (Number(quantity) || 1);
  const totalCost = (Number(cost) || 0) * (Number(quantity) || 1);
  const profit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setError('Vui lòng nhập tên sản phẩm/dịch vụ');
      return;
    }
    if (!customerId && (!isNewCustomer || !newCustName.trim())) {
      setError('Vui lòng chọn hoặc nhập tên khách hàng');
      return;
    }

    if (!Number.isSafeInteger(quantity) || quantity < 1 || (paymentStatus === 'partial' && (paidAmount <= 0 || paidAmount >= totalRevenue))) {
      setError('Kiểm tra số lượng và tiền đặt cọc (lớn hơn 0, nhỏ hơn tổng đơn)');
      return;
    }
    if (!warrantyDays || !Number.isSafeInteger(Number(warrantyDays)) || Number(warrantyDays) < 0) {
      setError('Vui lòng nhập số ngày bảo hành hợp lệ (0 nếu không bảo hành)');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        productName: productName.trim(),
        customerId: isNewCustomer ? undefined : customerId,
        newCustomer: isNewCustomer ? {
          name: newCustName.trim(),
          phone: newCustPhone.trim(),
          zalo: newCustZalo.trim() || newCustPhone.trim()
        } : undefined,
        price: Number(price),
        cost: Number(cost),
        quantity: Number(quantity),
        soldAt: new Date(soldAt),
        warrantyDays: Number(warrantyDays),
        warrantyStart: new Date(soldAt),
        paymentStatus,
        paidAmount: paymentStatus === 'partial' ? paidAmount : undefined,
        notes: notes.trim(),
        groupId: activeGroupId || null
      };

      await saleApi.create(payload);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Lỗi tạo đơn bán hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Tạo đơn bán hàng & bảo hành"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Tên sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Sản phẩm / Dịch vụ
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Tài khoản Gemini Advanced, Canva Pro 1 Năm..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
            {/* Quick product presets */}
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] self-center">Gợi ý nhanh:</span>
              {['Gemini Advanced', 'ChatGPT Plus', 'Canva Pro', 'Youtube Premium', 'Key Win 11'].map((item) => {
                const isSelected = productName === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setProductName(item)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500 scale-105'
                        : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:scale-105 hover:shadow-sm dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80 dark:hover:text-emerald-400'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Khách hàng */}
          <div className="rounded-xl p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Thông tin Khách hàng
              </label>
              <button
                type="button"
                onClick={() => setIsNewCustomer(!isNewCustomer)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {isNewCustomer ? 'Chọn từ danh sách có sẵn' : '+ Thêm khách mới'}
              </button>
            </div>

            {isNewCustomer ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Tên khách hàng *"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Zalo / Facebook"
                  value={newCustZalo}
                  onChange={(e) => setNewCustZalo(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {customers[0] && <p className="text-sm text-emerald-700 dark:text-emerald-400">Đã chọn: <strong>{customers[0].name}</strong> {customers[0].phone} <span className="text-xs">{customers[0].email}</span></p>}
                <CustomerSearch groupId={activeGroupId} onSelect={customer => { setCustomerId(customer._id); setCustomers([customer]); }} />
              </div>
            )}

            {/* Dữ liệu liên kết đồng bộ từ Sổ Thu Chi của khách hàng được chọn */}
            {!isNewCustomer && customerId && (() => {
              const selectedCustomer = customers.find(c => c._id === customerId);
              if (!selectedCustomer) return null;
              return (
                <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                        <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{selectedCustomer.name}</span>
                          {selectedCustomer.phone && (
                            <span className="text-[11px] font-normal text-slate-500">
                              • SĐT: {selectedCustomer.phone}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {selectedCustomer.zalo ? `Zalo: ${selectedCustomer.zalo}` : 'Khách hàng trong danh bạ'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-medium">Dữ liệu từ Sổ Thu Chi:</div>
                      <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {custLoading ? (
                          'Đang tải...'
                        ) : (
                          `Đã chi: ${formatVND(customerDetail?.stats?.totalSpent || 0)}`
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lịch sử giao dịch / Đơn hàng bên Thu Chi */}
                  {customerDetail?.transactions && customerDetail.transactions.length > 0 ? (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <History className="w-3 h-3 text-emerald-500" />
                          Giao dịch bên Sổ Thu Chi ({customerDetail.transactions.length} lần):
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Đã thanh toán {formatVND(customerDetail?.stats?.totalIncomeFromTx || 0)}
                        </span>
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {customerDetail.transactions.slice(0, 3).map((tx: any) => (
                          <div key={tx._id} className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-slate-50 dark:bg-slate-800/60">
                            <span className="truncate max-w-[220px] text-slate-700 dark:text-slate-300 font-medium">
                              {tx.title}
                            </span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap ml-2">
                              +{formatVND(tx.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : !custLoading && (
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      Chưa có lịch sử giao dịch cũ bên Sổ Thu Chi (Khách mua lần đầu)
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Giá bán, Giá vốn & Số lượng */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MoneyInput
              label="Giá bán (VNĐ)"
              value={price}
              onChange={setPrice}
              quickAmounts={[100000, 150000, 250000, 450000]}
            />
            <MoneyInput
              label="Giá vốn / Nhập (VNĐ)"
              value={cost}
              onChange={setCost}
              quickAmounts={[30000, 50000, 100000, 180000]}
            />
            <QuantityInput value={quantity} onChange={setQuantity} />
          </div>

          {/* Thẻ tính toán lợi nhuận thời gian thực */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Doanh thu & Lợi nhuận dự kiến:</div>
                <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                  Thu: {formatVND(totalRevenue)} | Lãi gộp: {formatVND(profit)} ({margin}%)
                </div>
              </div>
            </div>
          </div>

          {/* Ngày bán & Thời hạn bảo hành */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Ngày bán
              </label>
              <input
                type="date"
                value={soldAt}
                onChange={(e) => setSoldAt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Thời gian bảo hành (ngày)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  aria-label="Thời gian bảo hành (ngày)"
                  placeholder="Nhập số ngày"
                  required
                  value={warrantyDays}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (/^\d*$/.test(next) && Number.isSafeInteger(Number(next))) setWarrantyDays(next);
                  }}
                  onBlur={() => { if (warrantyDays) setWarrantyDays(String(Number(warrantyDays))); }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex flex-wrap gap-1.5">
                  {[7, 30, 90, 180, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setWarrantyDays(String(d))}
                      className={`min-h-9 px-2.5 py-1 rounded-lg transition-colors ${Number(warrantyDays) === d ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 hover:text-emerald-600'}`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Hết hạn: {calcWarrantyEnd()}
                </span>
              </div>
            </div>
          </div>

          {/* Trạng thái thanh toán */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Trạng thái thanh toán
            </label>
            <PaymentStatusPicker value={paymentStatus} onChange={setPaymentStatus} />
          </div>

          {/* Ghi chú tài khoản bàn giao */}
          {paymentStatus === 'partial' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Số tiền đã thu / đặt cọc</label>
              <MoneyInput value={paidAmount} onChange={setPaidAmount} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Thông tin tài khoản bàn giao (Email, Pass, Cookie, Key...)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Email: ... | Pass: ... | Hướng dẫn: ..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-mono text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="form-actions flex flex-wrap items-center justify-between gap-3">
            {totalRevenue > 0 ? (
              <button
                type="button"
                onClick={() => setShowQR(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 transition"
              >
                <QrCode className="w-4 h-4" />
                <span>VietQR</span>
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" isLoading={loading}>
                Lưu đơn
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* VietQR Modal */}
      <VietQRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        bankInfo={user?.bankInfo}
        amount={totalRevenue}
        description={`MF-SALE-${productName.slice(0, 10).toUpperCase().replace(/\s+/g, '')}`}
        title="Mã VietQR Thanh Toán Đơn Bán"
      />
    </>
  );
};

