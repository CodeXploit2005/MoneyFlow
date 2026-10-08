import React, { useState, useEffect } from 'react';
import { useGroupStore } from '../store/groupStore';
import { customerApi } from '../api/endpoints';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatVND, formatDate } from '../utils/format';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  ShoppingBag,
  Edit2,
  Trash2
} from 'lucide-react';
import { Customer, Sale } from '../types';

export const Customers: React.FC = () => {
  const { activeGroupId } = useGroupStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [keyword, setKeyword] = useState<string>('');

  // Customer Detail Modal
  const [selectedCustDetail, setSelectedCustDetail] = useState<Customer | null>(null);
  const [custStats, setCustStats] = useState<any>(null);
  const [custSales, setCustSales] = useState<Sale[]>([]);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Add/Edit Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [zalo, setZalo] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getAll({
        groupId: activeGroupId || undefined,
        keyword: keyword || undefined
      });
      const rawData = res.data as any;
      const list = Array.isArray(rawData) ? rawData : (rawData?.customers || []);
      setCustomers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [activeGroupId, keyword]);

  const handleOpenDetail = async (cust: Customer) => {
    setSelectedCustDetail(cust);
    setDetailLoading(true);
    try {
      const res = await customerApi.getById(cust._id);
      setCustStats(res.data?.stats);
      setCustSales(res.data?.sales || []);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCust(null);
    setName('');
    setPhone('');
    setZalo('');
    setEmail('');
    setNote('');
    setShowModal(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCust(cust);
    setName(cust.name);
    setPhone(cust.phone || '');
    setZalo(cust.zalo || '');
    setEmail(cust.email || '');
    setNote(cust.note || '');
    setShowModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setActionLoading(true);
    try {
      const payload: Partial<Customer> = {
        name: name.trim(),
        phone: phone.trim(),
        zalo: zalo.trim(),
        email: email.trim(),
        note: note.trim(),
        groupId: activeGroupId || null
      };

      if (editingCust) {
        await customerApi.update(editingCust._id, payload);
      } else {
        await customerApi.create(payload);
      }

      setShowModal(false);
      loadCustomers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCust = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      try {
        await customerApi.delete(id);
        loadCustomers();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Danh Sách Khách Hàng</span>
            <UserCheck className="w-6 h-6 text-emerald-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quản lý thông tin khách, lịch sử mua sắm và các đơn bảo hành liên quan
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm khách hàng
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, số điện thoại, zalo, email..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Grid Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-20 text-center text-xs text-slate-400">
            Đang tải dữ liệu khách hàng...
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 text-sm">
            Chưa có khách hàng nào. Hãy thêm khách hàng đầu tiên!
          </div>
        ) : (
          customers.map((cust) => (
            <div
              key={cust._id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-200 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-black flex items-center justify-center text-sm">
                      {cust.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {cust.name}
                      </h3>
                      {cust.phone && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cust)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Sửa thông tin"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCust(cust._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Xóa khách"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {cust.zalo && cust.zalo !== cust.phone && (
                  <div className="text-xs text-slate-500 mt-2">
                    Zalo: <strong className="text-slate-700 dark:text-slate-300">{cust.zalo}</strong>
                  </div>
                )}

                {cust.note && (
                  <p className="mt-2 text-xs text-slate-400 italic">
                    "{cust.note}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleOpenDetail(cust)}
                >
                  <ShoppingBag className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Xem lịch sử mua & bảo hành
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={!!selectedCustDetail}
        onClose={() => setSelectedCustDetail(null)}
        title={`Khách hàng: ${selectedCustDetail?.name || ''}`}
        maxWidth="max-w-2xl"
      >
        {detailLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Đang tải lịch sử...</div>
        ) : (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-center">
                <div className="text-[11px] text-slate-500">Tổng đã mua</div>
                <div className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                  {formatVND(custStats?.totalSpent)}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-center">
                <div className="text-[11px] text-slate-500">Số đơn hàng</div>
                <div className="font-extrabold text-sm text-indigo-700 dark:text-indigo-400">
                  {custStats?.totalOrders || 0} đơn
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-center">
                <div className="text-[11px] text-slate-500">Đang bảo hành</div>
                <div className="font-extrabold text-sm text-amber-700 dark:text-amber-400">
                  {custStats?.activeWarrantyCount || 0} đơn
                </div>
              </div>
            </div>

            {/* List of orders */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Các đơn đã mua
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {custSales.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">Chưa có đơn hàng nào</div>
                ) : (
                  custSales.map((sale) => (
                    <div
                      key={sale._id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{sale.productName}</div>
                        <div className="text-slate-400 text-[11px]">
                          Ngày mua: {formatDate(sale.soldAt)} • Hạn: {formatDate(sale.warrantyEnd)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">{formatVND(sale.price * sale.quantity)}</div>
                        <div className="text-[10px] text-slate-400">{sale.status === 'active' ? 'Còn hạn' : (sale.status === 'expiring_soon' ? 'Sắp hết' : 'Hết hạn')}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCust ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <Input
            label="Họ và tên khách hàng *"
            placeholder="Ví dụ: Nguyễn Văn A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Số điện thoại"
            placeholder="0912..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Zalo / Facebook / Telegram"
            placeholder="Số điện thoại hoặc link..."
            value={zalo}
            onChange={(e) => setZalo(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="khach@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi chú thêm về khách
            </label>
            <textarea
              rows={2}
              placeholder="Khách quen, sở thích, nguồn khách..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading}>
              {editingCust ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
