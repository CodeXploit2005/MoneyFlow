import { useAuthStore } from '../store/authStore';
import React, { useState, useEffect } from 'react';
import { useGroupStore } from '../store/groupStore';
import { warrantyApi } from '../api/endpoints';
import { RenewModal } from '../components/warranty/RenewModal';
import { ClaimModal } from '../components/warranty/ClaimModal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDate, formatWarrantyTime } from '../utils/format';
import {
  ShieldCheck,
  Calendar,
  ListFilter,
  RefreshCw,
  ShieldAlert,
  Phone,
  Search,
  X
} from 'lucide-react';
import { Sale } from '../types';

export const Warranty: React.FC = () => {
  const { activeGroupId, myRoleInActiveGroup } = useGroupStore();
  const userId = useAuthStore(state => state.user?._id);
  const canEdit = (sale: Sale) => !activeGroupId || (typeof sale.ownerId === 'object' ? sale.ownerId?._id : sale.ownerId) === userId || ['owner', 'admin'].includes(myRoleInActiveGroup || '');

  const [allWarranties, setWarranties] = useState<Sale[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Modals
  const [renewSale, setRenewSale] = useState<Sale | null>(null);
  const [claimSale, setClaimSale] = useState<Sale | null>(null);

  const loadWarranties = async () => {
    setLoading(true);
    try {
      const res = await warrantyApi.getAll({
        groupId: activeGroupId || undefined,
        status: statusFilter || undefined
      });
      setWarranties(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarranties();
  }, [activeGroupId, statusFilter]);

  const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const terms = normalize(keyword).trim().split(/\s+/).filter(Boolean);
  const warranties = allWarranties.filter(sale => {
    const customer = typeof sale.customerId === 'object' ? sale.customerId : null;
    const text = normalize(`${sale.productName} ${customer?.name || ''} ${customer?.phone || ''} ${sale.notes || ''}`);
    return terms.every(term => text.includes(term));
  });

  // Group by Calendar Date for Calendar View
  const calendarMap = new Map<string, Sale[]>();
  warranties.forEach((w) => {
    const dateKey = new Date(w.warrantyEnd).toISOString().split('T')[0];
    if (!calendarMap.has(dateKey)) {
      calendarMap.set(dateKey, []);
    }
    calendarMap.get(dateKey)!.push(w);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Quản Lý Bảo Hành & Hạn Dịch Vụ</span>
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Theo dõi thời hạn tài khoản đã bán, chủ động chăm sóc và nhắc gia hạn
          </p>
        </div>

        {/* View toggle (List vs Calendar) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'list'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Danh sách
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'calendar'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Lịch hạn (Calendar)
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="relative w-full sm:max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input type="search" aria-label="Tìm đơn bảo hành" placeholder="Tìm sản phẩm, tên khách hoặc số điện thoại…" value={keyword} onChange={event => setKeyword(event.target.value)} className="w-full min-h-12 pl-11 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 [&::-webkit-search-cancel-button]:appearance-none" />
        {keyword && <button type="button" aria-label="Xóa tìm đơn" onClick={() => setKeyword('')} className="absolute right-1 top-1 h-10 w-10 flex items-center justify-center text-slate-400"><X className="h-4 w-4" /></button>}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: 'Tất cả đơn', value: '' },
          { label: 'Sắp hết hạn (3 ngày)', value: 'expiring_soon' },
          { label: 'Còn bảo hành', value: 'active' },
          { label: 'Đã hết hạn', value: 'expired' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              statusFilter === tab.value
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* View Content */}
      {viewMode === 'list' ? (
        /* List View */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">Đang tải dữ liệu bảo hành...</div>
          ) : warranties.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">{keyword ? 'Không tìm thấy đơn phù hợp. Thử tên khách hoặc sản phẩm khác.' : 'Không có đơn bảo hành nào trong mục này'}</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {warranties.map((sale) => {
                const wInfo = formatWarrantyTime(sale.warrantyEnd);
                const custName = typeof sale.customerId === 'object' ? sale.customerId?.name : 'Khách';
                const custPhone = typeof sale.customerId === 'object' ? sale.customerId?.phone : '';

                return (
                  <div key={sale._id} className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                            {sale.productName}
                          </span>
                          <Badge variant={wInfo.status === 'active' ? 'success' : (wInfo.status === 'expiring_soon' ? 'warning' : 'danger')}>
                            {wInfo.text}
                          </Badge>
                          {sale.claims && sale.claims.length > 0 && (
                            <Badge variant="purple">
                              Đã bảo hành {sale.claims.length} lần
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          <span>Khách: <strong className="text-slate-700 dark:text-slate-300">{custName}</strong></span>
                          {custPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {custPhone}
                            </span>
                          )}
                          <span>Ngày bán: {formatDate(sale.soldAt)}</span>
                          <span>Hết hạn: <strong className="text-slate-800 dark:text-slate-200">{formatDate(sale.warrantyEnd)}</strong></span>
                        </div>

                        {sale.notes && (
                          <div className="mt-2 text-xs font-mono p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 max-w-xl truncate">
                            {sale.notes}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={!canEdit(sale) || sale.status === 'void'}
                          onClick={() => setRenewSale(sale)}
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Gia hạn (+Ngày)
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canEdit(sale) || sale.status === 'void'}
                          onClick={() => setClaimSale(sale)}
                        >
                          <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-500" />
                          Xử lý / Đổi
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
            Lịch Đơn Hàng Hết Hạn Theo Ngày
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from(calendarMap.entries()).map(([dateStr, items]) => (
              <div key={dateStr} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200 mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    {formatDate(dateStr)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px]">
                    {items.length} đơn
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((it) => {
                    const custName = typeof it.customerId === 'object' ? it.customerId?.name : 'Khách';
                    return (
                      <div key={it._id} className="text-xs p-2 rounded-lg bg-white dark:bg-slate-900 shadow-xs border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div className="truncate mr-2">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{it.productName}</div>
                          <div className="text-[11px] text-slate-400 truncate">{custName}</div>
                        </div>
                        <button
                          disabled={!canEdit(it) || it.status === 'void'}
                          onClick={() => setRenewSale(it)}
                          className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 text-[10px] font-bold shrink-0 hover:bg-emerald-100"
                        >
                          Gia hạn
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Renew Modal */}
      <RenewModal
        isOpen={!!renewSale}
        onClose={() => setRenewSale(null)}
        sale={renewSale}
        onSuccess={loadWarranties}
      />

      {/* Claim Modal */}
      <ClaimModal
        isOpen={!!claimSale}
        onClose={() => setClaimSale(null)}
        sale={claimSale}
        onSuccess={loadWarranties}
      />
    </div>
  );
};
