import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, ChevronDown, Check, Plus } from 'lucide-react';
import { useGroupStore } from '../../store/groupStore';
import { groupApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';

/**
 * Component WorkspaceSwitcher dạng dropdown
 * Hiển thị icon người + "Ví cá nhân" hoặc nhóm hiện tại + mũi tên xuống
 */
export const WorkspaceSwitcher = ({ isCollapsed = false }) => {
  const navigate = useNavigate();
  const { activeGroupId, activeGroupName, setActiveGroup, groups, setGroups } = useGroupStore();
  const userId = useAuthStore(state => state.user?._id);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tải danh sách nhóm người dùng đã tham gia
  useEffect(() => {
    let cancelled = false;
    const fetchGroups = async () => {
      try {
        const res = await groupApi.getMyGroups();
        if (!cancelled) setGroups(res.data || []);
      } catch (err) {
        console.warn('Cannot fetch groups', err);
      }
    };
    fetchGroups();
    window.addEventListener('focus', fetchGroups);
    return () => { cancelled = true; window.removeEventListener('focus', fetchGroups); };
  }, [userId, isOpen, setGroups]);

  const handleSelectPersonal = () => {
    setActiveGroup(null, 'Ví cá nhân', null);
    setIsOpen(false);
  };

  const handleSelectGroup = (group) => {
    setActiveGroup(group._id, group.name, group.myRole);
    setIsOpen(false);
  };

  if (isCollapsed) {
    return (
      <div className="flex justify-center my-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          title={activeGroupName}
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243044] flex items-center justify-center text-[#10B981]"
        >
          <User className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative my-3" ref={dropdownRef}>
      {/* Nút bấm hiển thị Workspace Switcher */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#151C2C] border border-[#E2E8F0] dark:border-[#243044] hover:border-slate-300 dark:hover:border-slate-600 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#059669] dark:bg-emerald-950/50 dark:text-[#10B981] flex items-center justify-center shrink-0">
            {activeGroupId ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
          </div>
          <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9] truncate">
            {activeGroupName || 'Ví cá nhân'}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white dark:bg-[#151C2C] border border-slate-200 dark:border-[#243044] shadow-xl p-1.5 space-y-1 animate-fade-in">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Không gian làm việc
          </div>

          {/* Ví cá nhân */}
          <button
            type="button"
            onClick={handleSelectPersonal}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition ${
              !activeGroupId
                ? 'bg-emerald-50 text-[#059669] dark:bg-emerald-950/40 dark:text-[#34D399] font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E293B]'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Ví cá nhân</span>
            </div>
            {!activeGroupId && <Check className="w-3.5 h-3.5" />}
          </button>

          {/* Danh sách các nhóm */}
          {groups.map((group) => {
            const isSelected = activeGroupId === group._id;
            return (
              <button
                key={group._id}
                type="button"
                onClick={() => handleSelectGroup(group)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition ${
                  isSelected
                    ? 'bg-emerald-50 text-[#059669] dark:bg-emerald-950/40 dark:text-[#34D399] font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E293B]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{group.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}

          <div className="pt-1 border-t border-slate-100 dark:border-[#243044]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/groups');
              }}
              className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quản lý & Tham gia nhóm</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
