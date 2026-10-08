import React, { useState } from 'react';
import { Wallet, Users, ChevronDown, Check, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGroupStore } from '../../store/groupStore';
import { useWorkspaceGroups } from '../../hooks/useWorkspaceGroups';
import { Modal } from '../ui/Modal';

export const MobileWorkspaceSwitcher = () => {
  const [open, setOpen] = useState(false);
  const { activeGroupId, activeGroupName, groups, setActiveGroup } = useGroupStore();
  const { isFetching, isError, refetch } = useWorkspaceGroups(open);
  const navigate = useNavigate();
  const choose = (group: any = null) => {
    setActiveGroup(group?._id || null, group?.name || 'Ví cá nhân', group?.myRole || null);
    setOpen(false);
    navigate('/dashboard');
  };
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-label="Chuyển ví cá nhân hoặc nhóm" className="flex min-h-11 w-full min-w-0 items-center gap-2 text-left">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">{activeGroupId ? <Users className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}</span>
      <span className="min-w-0 flex-1"><span className="block text-[10px] text-slate-400">{activeGroupId ? 'Ví nhóm' : 'Không gian làm việc'}</span><span className="block truncate text-xs font-bold text-slate-900 dark:text-white">{activeGroupId ? activeGroupName : 'Ví cá nhân'}</span></span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
    </button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Chuyển không gian làm việc" maxWidth="max-w-md">
      <div className="space-y-4 pb-2">
        <button type="button" onClick={() => choose()} className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border p-3 text-left ${!activeGroupId ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700'}`}>
          <Wallet className="h-5 w-5 shrink-0 text-emerald-600" /><span className="flex-1"><span className="block text-sm font-semibold">Ví cá nhân</span><span className="block text-xs text-slate-500">Thu chi và dữ liệu riêng của bạn</span></span>{!activeGroupId && <Check className="h-4 w-4 text-emerald-500" />}
        </button>
        <div className="flex min-h-5 items-center justify-between text-[11px] text-slate-400"><span className="font-semibold uppercase tracking-wide">Ví nhóm</span><span role="status" className="text-[10px]">{isFetching ? 'Đang cập nhật…' : groups.length ? `${groups.length} nhóm` : ''}</span></div>
        <div className="min-h-[120px] max-h-[40dvh] space-y-2 overflow-y-auto overscroll-contain" aria-busy={isFetching}>
        {isError && <p role="alert" className="text-xs text-rose-500">Chưa tải được nhóm. <button onClick={() => refetch()} className="min-h-11 underline">Thử lại</button></p>}
        {!groups.length && !isError && <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 text-center dark:bg-slate-800/40"><Users className="h-5 w-5 text-slate-400" /><p className="text-xs text-slate-500">{isFetching ? 'Đang tải danh sách nhóm' : 'Bạn chưa tham gia nhóm nào'}</p></div>}
        {groups.map(group => <button key={group._id} type="button" onClick={() => choose(group)} className={`flex min-h-14 w-full items-center gap-3 rounded-xl p-3 text-left ${activeGroupId === group._id ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-slate-50 dark:bg-slate-800'}`}>
          <Users className="h-5 w-5 shrink-0 text-emerald-500" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{group.name}</span><span className="text-xs text-slate-400">{group.myRole === 'owner' ? 'Chủ nhóm' : group.myRole === 'admin' ? 'Quản trị viên' : 'Thành viên'}</span></span>{activeGroupId === group._id && <Check className="h-4 w-4 shrink-0 text-emerald-500" />}
        </button>)}
        </div>
        <button type="button" onClick={() => { setOpen(false); navigate('/groups'); }} className="flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-emerald-600"><Plus className="h-4 w-4" />Quản lý / tham gia nhóm</button>
      </div>
    </Modal>
  </>;
};
