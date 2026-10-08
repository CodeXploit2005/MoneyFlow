import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  EyeOff,
  Eye,
  ArrowUp,
  ArrowDown,
  Lock,
  AlertTriangle,
  Check,
  X,
  ShieldAlert,
  Search,
  Users
} from 'lucide-react';
import { CategoryIcon, AVAILABLE_ICONS, AVAILABLE_COLORS } from '../../components/categories/CategoryIcon';
import { categoryApi } from '../../api/endpoints';
import { useGroupStore } from '../../store/groupStore';
import { Modal } from '../../components/ui/Modal';

export const CategoriesTab = () => {
  const { activeGroupId, activeGroupName, myRoleInActiveGroup } = useGroupStore();

  const [activeSubTab, setActiveSubTab] = useState('expense'); // 'expense' | 'income'
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // Modal thêm/sửa danh mục
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('tag');
  const [catColor, setCatColor] = useState('#10b981');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal xác nhận ẩn danh mục
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Quyền hạn: Nếu ở nhóm, role member chỉ được xem
  const isGroup = Boolean(activeGroupId);
  const canEdit = !isGroup || myRoleInActiveGroup === 'owner' || myRoleInActiveGroup === 'admin' || myRoleInActiveGroup === null;

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getAll({
        groupId: activeGroupId || undefined,
        includeArchived: 'true'
      });
      const data = Array.isArray(res) ? res : (res?.data || []);
      setCategories(data);
    } catch (err) {
      console.error('Lỗi nạp danh mục:', err);
      showFeedback('error', 'Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [activeGroupId]);

  const showFeedback = (type, text) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4000);
  };

  // Lọc theo subtab (chi / thu) và trạng thái ẩn
  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => c.type === activeSubTab)
      .filter((c) => (showArchived ? true : !c.isArchived))
      .filter((c) =>
        searchTerm ? c.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) : true
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [categories, activeSubTab, showArchived, searchTerm]);

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCatName('');
    setCatIcon(activeSubTab === 'income' ? 'banknote' : 'utensils');
    setCatColor(activeSubTab === 'income' ? '#10b981' : '#ef4444');
    setModalError('');
    setModalMode('create');
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setCatName(category.name);
    setCatIcon(category.icon || 'tag');
    setCatColor(category.color || '#10b981');
    setModalError('');
    setModalMode('edit');
  };

  // Lưu danh mục (Tạo mới hoặc Cập nhật)
  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      setModalError('Vui lòng nhập tên danh mục');
      return;
    }

    setIsSubmitting(true);
    setModalError('');
    try {
      if (modalMode === 'create') {
        const res = await categoryApi.create({
          name: catName.trim(),
          type: activeSubTab,
          icon: catIcon,
          color: catColor,
          groupId: activeGroupId || null
        });
        const created = res?.data || res;
        setCategories((prev) => [...prev, created]);
        showFeedback('success', `Đã thêm danh mục "${catName}"`);
      } else if (modalMode === 'edit' && editingCategory) {
        // Nếu là danh mục hệ thống, chỉ gửi icon và color
        const payload = editingCategory.isSystem
          ? { icon: catIcon, color: catColor }
          : { name: catName.trim(), icon: catIcon, color: catColor };

        const res = await categoryApi.update(editingCategory._id, payload);
        const updated = res?.data || res;
        setCategories((prev) =>
          prev.map((c) => (c._id === editingCategory._id ? { ...c, ...updated } : c))
        );
        showFeedback('success', `Đã cập nhật danh mục "${catName}"`);
      }
      setModalMode(null);
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Lỗi thao tác danh mục');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thực hiện ẩn danh mục
  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      await categoryApi.archive(archiveTarget._id);
      setCategories((prev) =>
        prev.map((c) => (c._id === archiveTarget._id ? { ...c, isArchived: true } : c))
      );
      showFeedback('success', `Đã ẩn danh mục "${archiveTarget.name}"`);
      setArchiveTarget(null);
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Không thể ẩn danh mục');
    } finally {
      setIsArchiving(false);
    }
  };

  // Khôi phục danh mục
  const handleRestore = async (category) => {
    try {
      await categoryApi.restore(category._id);
      setCategories((prev) =>
        prev.map((c) => (c._id === category._id ? { ...c, isArchived: false } : c))
      );
      showFeedback('success', `Đã khôi phục danh mục "${category.name}"`);
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Không thể khôi phục danh mục');
    }
  };

  // Đổi thứ tự lên / xuống
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredCategories.length) return;

    const listCopy = [...filteredCategories];
    const [movedItem] = listCopy.splice(index, 1);
    listCopy.splice(targetIndex, 0, movedItem);

    const reorderedItems = listCopy.map((item, idx) => ({
      id: item._id,
      sortOrder: idx + 1
    }));

    // Cập nhật state lạc quan
    setCategories((prev) =>
      prev.map((c) => {
        const found = reorderedItems.find((r) => r.id === c._id);
        return found ? { ...c, sortOrder: found.sortOrder } : c;
      })
    );

    try {
      await categoryApi.reorder(reorderedItems);
    } catch (err) {
      console.error('Lỗi sắp xếp:', err);
      loadCategories();
    }
  };

  return (
    <div className="space-y-6">
      {/* Thông báo phản hồi */}
      {feedbackMsg.text && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2 ${
            feedbackMsg.type === 'error'
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Check className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg({ type: '', text: '' })}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Banner thông báo quyền khi ở Không gian Nhóm */}
      {isGroup && (
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/40 flex items-start gap-3">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-indigo-900 dark:text-indigo-200">
              Danh mục nhóm: <span className="underline">{activeGroupName}</span>
            </p>
            {canEdit ? (
              <p className="text-indigo-700 dark:text-indigo-300">
                Bạn là Quản trị viên của nhóm này. Bạn có toàn quyền cấu hình, thêm mới và quản lý danh mục chung cho toàn bộ thành viên.
              </p>
            ) : (
              <p className="text-indigo-600 dark:text-indigo-400">
                Bạn đang ở vai trò Thành viên (Member). Bạn có thể xem và chọn danh mục khi ghi nhận giao dịch; chỉ Trưởng nhóm / Quản trị viên mới có quyền thêm, sửa hoặc ẩn danh mục.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Thanh điều khiển trên cùng: 2 Tab con Chi / Thu + Nút Thêm + Công tắc Ẩn */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#151D2A] p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Hai Tab Con */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('expense')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'expense'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Danh mục CHI ({categories.filter((c) => c.type === 'expense' && !c.isArchived).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('income')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'income'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Danh mục THU ({categories.filter((c) => c.type === 'income' && !c.isArchived).length})
          </button>
        </div>

        {/* Tìm kiếm & Nút hành động */}
        <div className="flex items-center gap-2.5">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Công tắc hiện danh mục đã ẩn */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400 select-none px-2">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="hidden sm:inline">Hiện mục đã ẩn</span>
          </label>

          {/* Nút "+ Thêm danh mục" */}
          {canEdit && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 shrink-0 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Thêm mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Danh sách danh mục: Hiển thị Thẻ trên Mobile, Hàng trên Desktop */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Đang tải danh mục...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#151D2A] rounded-3xl border border-slate-200 dark:border-slate-800">
          <Tag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Chưa có danh mục nào phù hợp
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm ? 'Thử tìm với từ khóa khác' : 'Nhấn nút Thêm mới ở trên để tạo danh mục'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {filteredCategories.map((category, index) => {
            const isFirst = index === 0;
            const isLast = index === filteredCategories.length - 1;

            return (
              <div
                key={category._id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  category.isArchived
                    ? 'bg-slate-50/60 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-75'
                    : 'bg-white dark:bg-[#151D2A] border-slate-200 dark:border-slate-800/80 hover:shadow-xs'
                }`}
              >
                {/* Khối bên trái: Icon + Tên + Badge */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Ô icon bo tròn có nền 15% màu */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                    style={{
                      backgroundColor: `${category.color || '#10b981'}26`,
                      color: category.color || '#10b981'
                    }}
                  >
                    <CategoryIcon name={category.icon} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {category.name}
                      </h4>

                      {/* Badge Hệ thống */}
                      {category.isSystem && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                          <Lock className="w-3 h-3" />
                          <span>Hệ thống</span>
                        </span>
                      )}

                      {/* Badge Đã ẩn */}
                      {category.isArchived && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <EyeOff className="w-3 h-3" />
                          <span>Đã ẩn</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: category.color || '#10b981' }}
                      />
                      <span>Mã màu: {category.color}</span>
                      <span>•</span>
                      <span>{category.transactionCount || 0} giao dịch đang dùng</span>
                    </div>
                  </div>
                </div>

                {/* Khối bên phải: Nút sắp xếp & Thao tác */}
                {canEdit && (
                  <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                    {/* Sắp xếp thứ tự Lên/Xuống */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 mr-1">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveOrder(index, 'up')}
                        title="Đẩy lên trên"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveOrder(index, 'down')}
                        title="Đẩy xuống dưới"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Sửa icon / màu / tên */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(category)}
                      title={category.isSystem ? 'Đổi icon & màu (Danh mục hệ thống)' : 'Chỉnh sửa'}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Ẩn / Khôi phục */}
                    {category.isArchived ? (
                      <button
                        type="button"
                        onClick={() => handleRestore(category)}
                        title="Khôi phục danh mục"
                        className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={category.isSystem}
                        onClick={() => setArchiveTarget(category)}
                        title={
                          category.isSystem
                            ? 'Danh mục hệ thống không thể ẩn'
                            : 'Ẩn danh mục'
                        }
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL THÊM / SỬA DANH MỤC */}
      <Modal
        isOpen={Boolean(modalMode)}
        onClose={() => setModalMode(null)}
        title={
          modalMode === 'create'
            ? `Thêm danh mục ${activeSubTab === 'income' ? 'Thu' : 'Chi'} mới`
            : editingCategory?.isSystem
            ? 'Đổi màu & Biểu tượng danh mục'
            : 'Chỉnh sửa danh mục'
        }
        description={editingCategory?.isSystem ? 'Khóa hệ thống: Không thể đổi tên hoặc loại' : null}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitCategory} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
              {modalError}
            </div>
          )}

          {/* Tên danh mục */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              disabled={editingCategory?.isSystem}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Ví dụ: Tiền thưởng, Quà tặng..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
              autoFocus={!editingCategory?.isSystem}
            />
          </div>

          {/* Chọn màu sắc */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Màu đại diện
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCatColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    catColor === c
                      ? 'scale-125 ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-slate-900'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Chọn biểu tượng */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Biểu tượng (Icon)
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800 rounded-xl">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic.name}
                  type="button"
                  onClick={() => setCatIcon(ic.name)}
                  title={ic.label}
                  className={`p-2.5 rounded-lg flex items-center justify-center transition-colors ${
                    catIcon === ic.name
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CategoryIcon name={ic.name} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !catName.trim()}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/25 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : modalMode === 'create' ? 'Tạo danh mục' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL XÁC NHẬN ẨN DANH MỤC */}
      <Modal
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        title="Xác nhận ẩn danh mục?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Danh mục <span className="font-bold text-slate-900 dark:text-white">"{archiveTarget?.name}"</span> sẽ được ẩn khỏi danh sách lựa chọn khi thêm giao dịch mới. Toàn bộ giao dịch cũ vẫn được giữ nguyên nhãn.
          </p>

          {archiveTarget?.type === 'expense' && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Nếu danh mục này đang có Hạn mức ngân sách, hạn mức đó sẽ tự động bị xóa/tắt.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setArchiveTarget(null)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isArchiving}
              onClick={confirmArchive}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/25"
            >
              {isArchiving ? 'Đang ẩn...' : 'Đồng ý Ẩn'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesTab;
