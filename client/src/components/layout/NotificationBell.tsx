import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check, CheckCheck, UserPlus, Trash2, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi, groupApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import { errorMessage } from '../../utils/errorMessage';
import { Modal } from '../ui/Modal';

const NotificationActions = ({ disabled, onDelete }: { disabled: boolean; onDelete: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!expanded) return;
    const dismiss = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setExpanded(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [expanded]);
  return <div ref={container} className="absolute right-1 top-1 z-10" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false);
  }} onKeyDown={event => {
    if (event.key === 'Escape' && expanded) {
      event.preventDefault(); event.stopPropagation(); setExpanded(false); trigger.current?.focus();
    }
  }}>
    <button ref={trigger} type="button" disabled={disabled} aria-label="Tùy chọn thông báo" aria-expanded={expanded} onClick={() => setExpanded(value => !value)} className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 disabled:opacity-40"><MoreHorizontal className="h-4 w-4" /></button>
    {expanded && <div className="absolute right-1 top-10 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <button type="button" disabled={disabled} onClick={() => { setExpanded(false); onDelete(); }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"><Trash2 className="h-3.5 w-3.5" />Xóa thông báo</button>
    </div>}
  </div>;
};

export const NotificationBell = () => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const userId = useAuthStore(state => state.user?._id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const key = ['notifications', userId];
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: key,
    queryFn: async () => (await notificationApi.getAll()).data,
    enabled: !!userId,
    refetchInterval: 15000,
    refetchOnWindowFocus: true
  });
  useEffect(() => { if (open) { setError(''); void refetch(); } }, [open, refetch]);
  useEffect(() => {
    const onResize = () => setOpen(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const run = async (id: string, action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(id); setError('');
    try { await action(); await queryClient.invalidateQueries({ queryKey: key }); }
    catch (err: unknown) { setError(errorMessage(err, 'Không thể xử lý thông báo')); }
    finally { setBusy(null); }
  };
  const respond = (id: string, action: 'accept' | 'decline') => run(id, async () => {
    const result = await notificationApi.respondToInvite(id, action);
    if (action === 'accept') {
      // Refresh notifications even if loading the new workspace fails.
      await queryClient.invalidateQueries({ queryKey: key });
      const groups = (await groupApi.getMyGroups()).data || [];
      useGroupStore.getState().setGroups(groups);
      const joined = groups.find((group: any) => group._id === result.data.groupId);
      if (joined) useGroupStore.getState().setActiveGroup(joined._id, joined.name, joined.myRole);
      setOpen(false);
      navigate(`/groups/${result.data.groupId}`);
    }
  });
  const unread = data?.unreadCount || 0;
  const items = (data?.notifications || []).filter((item: any) => filter === 'all' || !item.isRead);
  const canClearRead = (data?.notifications || []).some((item: any) => item.isRead && (item.type !== 'invite' || ['accepted', 'declined'].includes(item.data?.status)));
  return <>
    <button ref={anchorRef} type="button" onClick={() => setOpen(v => !v)} aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ''}`} aria-haspopup="dialog" aria-expanded={open} title="Thông báo" className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
      <Bell className="w-5 h-5" />
      {unread > 0 && <span className="absolute right-0 top-0 min-w-4 rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
    </button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title={<span className="flex items-center gap-2.5"><span className="notification-heading-icon"><Bell className="h-4 w-4" /></span>Thông báo <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-xs font-semibold text-emerald-600">{unread} mới</span></span>} maxWidth="max-w-lg" anchorRef={anchorRef} className="notification-panel">
      <div className="notification-toolbar">
        <div role="group" aria-label="Lọc thông báo" className="flex gap-4">
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')} className={`notification-filter ${filter === 'all' ? 'is-active' : ''}`}>Tất cả</button>
          <button type="button" aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')} className={`notification-filter ${filter === 'unread' ? 'is-active' : ''}`}>Chưa đọc</button>
        </div>
        <button type="button" disabled={!!busy || !unread || isError} onClick={() => run('all', () => notificationApi.markAllAsRead())} className="notification-read-all"><CheckCheck className="h-3.5 w-3.5" /><span>Đọc tất cả</span></button>
      </div>
      <div className="notification-list">
        {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}
        {isPending ? <p role="status" className="py-6 text-center text-slate-500">Đang tải thông báo...</p> : isError ? <div role="alert" className="text-sm">Không thể tải thông báo. <button onClick={() => refetch()} className="min-h-11 text-emerald-600 underline">Thử lại</button></div> : <>
          {!items.length && <div className="notification-empty"><Bell className="h-7 w-7 text-slate-300 dark:text-slate-600" /><p>{filter === 'unread' ? 'Bạn đã đọc hết thông báo' : 'Bạn chưa có thông báo nào'}</p></div>}
          {items.map((item: any) => <article key={item._id} className={`notification-item relative rounded-xl border p-3 pl-12 ${item.isRead ? 'border-slate-200 dark:border-slate-700' : 'border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20'}`}>
            <span className="notification-item-icon absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">{item.type === 'invite' ? <UserPlus className="h-4 w-4" /> : <Bell className="h-4 w-4" />}</span>
            {!item.isRead && <span className="absolute right-12 top-5 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            <NotificationActions disabled={!!busy} onDelete={() => { void run(item._id, () => notificationApi.remove(item._id)); }} />
            <h4 className="pr-9 text-[13px] font-semibold leading-5 break-words">{item.title}</h4>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300 break-words">{item.message}</p>
            <time className="mt-1 block text-[10px] text-slate-400" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</time>
            {item.type === 'invite' && !['accepted', 'declined'].includes(item.data?.status) ? <div className="notification-actions mt-2.5 flex flex-wrap gap-2">
              <button disabled={!!busy} onClick={() => respond(item._id, 'accept')} className="inline-flex items-center justify-center gap-1.5 min-h-8 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-50"><Check className="h-3.5 w-3.5" />{busy === item._id ? 'Đang xử lý...' : 'Chấp nhận'}</button>
              <button disabled={!!busy} onClick={() => respond(item._id, 'decline')} className="min-h-8 rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800 px-3 text-xs disabled:opacity-50">Từ chối</button>
            </div> : item.type === 'invite' ? <p className="mt-2 text-xs font-semibold text-slate-500">{item.data?.status === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}</p> : null}
            {!item.isRead && <button disabled={!!busy} onClick={() => run(item._id, () => notificationApi.markAsRead(item._id))} className="notification-mark-read mt-1 min-h-6 text-[10px] text-emerald-600 dark:text-emerald-400 disabled:opacity-50">Đánh dấu đã đọc</button>}
          </article>)}
        </>}
      </div>
      {canClearRead && !isError && <div className="flex justify-end border-t border-slate-200/70 dark:border-slate-700/70 px-4 py-0.5">
        <button type="button" disabled={!!busy} title="Xóa thông báo đã đọc, giữ lại lời mời chưa xử lý" onClick={() => run('clear-read', () => notificationApi.clearRead())} className="min-h-11 rounded-lg px-2 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-40">Dọn mục đã đọc</button>
      </div>}
    </Modal>
  </>;
};
