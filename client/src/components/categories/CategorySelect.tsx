import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronDown,
  Check,
  Search,
  Plus,
  X,
  Tag,
  Sparkles
} from 'lucide-react';
import { CategoryIcon, AVAILABLE_ICONS, AVAILABLE_COLORS } from './CategoryIcon';
import { categoryApi } from '../../api/endpoints';
import { useGroupStore } from '../../store/groupStore';
import { Category } from '../../types';
import { errorMessage } from '../../utils/errorMessage';
import { Modal } from '../ui/Modal';

/**
 * CategorySelect: Dropdown chọn danh mục tuỳ chỉnh cao cấp
 * - Desktop: Popover thả xuống mượt mà
 * - Mobile: Bottom sheet chuẩn trải nghiệm chạm (touch-friendly, min-h 44px)
 * - Tự động lọc theo type (thu/chi), tìm kiếm thông minh khi >8 mục
 * - Tích hợp tạo nhanh danh mục mới ngay tại chỗ
 */
export const CategorySelect = ({
  value,
  onChange,
  type = 'expense',
  categories: propCategories = null,
  excludeCogs = false,
  disabled = false,
  label = 'Danh mục',
  showCount = true,
  className = ''
}: { value?: string; onChange: (id: string) => void; type?: 'income' | 'expense'; categories?: Category[] | null; excludeCogs?: boolean; disabled?: boolean; label?: string; showCount?: boolean; className?: string }) => {
  const { activeGroupId } = useGroupStore();
  const [internalCategories, setInternalCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // State Modal tạo danh mục nhanh
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('tag');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load danh mục nếu không truyền propCategories
  const loadCategories = async () => {
    try {
      const res = await categoryApi.getAll({
        groupId: activeGroupId || undefined,
        type
      });
      const data = Array.isArray(res) ? res : (res?.data || []);
      setInternalCategories(data);
    } catch (err) {
      console.warn('Lỗi tải danh mục:', err);
    }
  };

  useEffect(() => {
    if (!propCategories) {
      loadCategories();
    }
  }, [type, activeGroupId, propCategories]);

  const rawList = propCategories || internalCategories;

  // Lọc theo type, không lấy đã ẩn, và loại bỏ cogs nếu excludeCogs = true
  const availableCategories = useMemo(() => {
    return rawList.filter((cat) => {
      if (cat.isArchived) return false;
      if (cat.type && cat.type !== type) return false;
      if (excludeCogs && cat.name === 'Giá vốn / Nhập hàng') return false;
      return true;
    });
  }, [rawList, type, excludeCogs]);

  // Lọc theo tìm kiếm
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return availableCategories;
    const q = searchQuery.toLowerCase().trim();
    return availableCategories.filter((c) =>
      c.name.toLowerCase().includes(q)
    );
  }, [availableCategories, searchQuery]);

  // Tìm danh mục đang chọn
  const selectedCategory = useMemo(() => {
    return (
      availableCategories.find((c) => c._id === value) ||
      availableCategories.find((c) => c.name === 'Khác') ||
      availableCategories[0] ||
      null
    );
  }, [availableCategories, value]);

  // Tự động gán nếu value chưa có
  useEffect(() => {
    if (availableCategories.length > 0 && !value) {
      const defaultChoice =
        availableCategories.find((c) => c.name === 'Khác') ||
        availableCategories[0];
      if (defaultChoice && onChange) {
        onChange(defaultChoice._id);
      }
    }
  }, [availableCategories, value, onChange]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto focus ô tìm kiếm nếu danh sách dài
      if (availableCategories.length > 8) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, availableCategories.length]);

  // Hỗ trợ phím mũi tên & Enter & Esc
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredCategories.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCategories.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCategories[highlightedIndex]) {
        onChange(filteredCategories[highlightedIndex]._id);
        setIsOpen(false);
      }
    }
  };

  // Xử lý tạo danh mục mới
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCreateError('Vui lòng nhập tên danh mục');
      return;
    }
    setCreateError('');
    setIsSubmitting(true);
    try {
      const res = await categoryApi.create({
        name: newCatName.trim(),
        type,
        icon: newCatIcon,
        color: newCatColor,
        groupId: activeGroupId || null
      });
      const created = res?.data || res;
      if (created && created._id) {
        setInternalCategories((prev) => [...prev, created]);
        onChange(created._id);
      }
      setShowCreateModal(false);
      setNewCatName('');
      setIsOpen(false);
    } catch (err) {
      setCreateError(errorMessage(err, 'Lỗi tạo danh mục'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Label & Số lượng khả dụng */}
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-emerald-500" />
            {label}
          </label>
          {showCount && (
            <span className="text-xs text-slate-400 font-normal">
              {availableCategories.length} danh mục khả dụng
            </span>
          )}
        </div>
      )}

      {/* Nút bấm hiển thị (Trigger Button) - Tối thiểu 44px, bo góc mượt mà */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all text-left ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            : isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-[#151D2A]'
            : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#151D2A] hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {selectedCategory ? (
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Ô icon bo tròn có nền 15% màu */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform"
              style={{
                backgroundColor: `${selectedCategory.color || '#10b981'}26`,
                color: selectedCategory.color || '#10b981'
              }}
            >
              <CategoryIcon name={selectedCategory.icon} className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {selectedCategory.name}
            </span>
            {selectedCategory.isSystem && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium shrink-0">
                Hệ thống
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-slate-400">Chọn danh mục...</span>
        )}

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-500' : ''
          }`}
        />
      </button>

      {/* POPOVER (Desktop) & BOTTOM SHEET (Mobile) */}
      {isOpen && (
        <>
          {/* Backdrop mờ trên mobile để tạo hiệu ứng bottom sheet */}
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`z-50 bg-white dark:bg-[#151D2A] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
              // Mobile: Dạng bottom sheet trượt lên từ đáy
              'fixed bottom-0 left-0 right-0 max-h-[80vh] rounded-b-none p-2 ' +
              // Desktop: Popover nằm ngay bên dưới nút bấm
              'md:absolute md:bottom-auto md:top-full md:left-0 md:right-0 md:max-h-80 md:rounded-2xl md:mt-1.5 md:p-1.5'
            }`}
          >
            {/* Thanh kéo nhỏ trên mobile */}
            <div className="md:hidden w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2" />

            {/* Header mobile */}
            <div className="md:hidden flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Chọn danh mục ({type === 'income' ? 'Thu' : 'Chi'})
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ô tìm kiếm thông minh khi danh mục dài hơn 8 */}
            {availableCategories.length > 8 && (
              <div className="p-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Tìm danh mục..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Danh sách danh mục */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
            >
              {filteredCategories.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Không tìm thấy danh mục phù hợp
                </div>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const isSelected = selectedCategory?._id === cat._id;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => {
                        onChange(cat._id);
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : isHighlighted
                          ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${cat.color || '#10b981'}26`,
                            color: cat.color || '#10b981'
                          }}
                        >
                          <CategoryIcon name={cat.icon} className="w-4 h-4" />
                        </div>
                        <span className="text-sm truncate">{cat.name}</span>
                        {cat.isSystem && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            Khóa
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Cuối danh sách: "+ Tạo danh mục mới" */}
            <div className="p-1 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(true);
                  setNewCatName('');
                  setCreateError('');
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Tạo danh mục mới</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal nhỏ tạo danh mục nhanh tại chỗ */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={`Tạo danh mục ${type === 'income' ? 'Thu' : 'Chi'} mới`}
        description="Sẽ tự chọn danh mục sau khi tạo xong"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          {createError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
              {createError}
            </div>
          )}

          {/* Tên danh mục */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Tiền điện nước, Học phí..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>

          {/* Chọn màu sắc */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Màu sắc
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCatColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    newCatColor === c
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
            <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic.name}
                  type="button"
                  onClick={() => setNewCatIcon(ic.name)}
                  title={ic.label}
                  className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                    newCatIcon === ic.name
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CategoryIcon name={ic.name} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newCatName.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo và Chọn'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategorySelect;
