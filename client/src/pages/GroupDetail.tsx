import { OptionPicker } from '../components/ui/OptionPicker';
import { Avatar } from '../components/ui/Avatar';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupApi } from '../api/endpoints';
import { useGroupStore } from '../store/groupStore';
import { useAuthStore } from '../store/authStore';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatVND, formatDate } from '../utils/format';
import {
  Users,
  ArrowLeft,
  Wallet,
  UserPlus,
  Trash2,
  LogOut,
  Activity,
  Copy,
  Check,
  Lock,
  Pencil,
  Trophy
} from 'lucide-react';
import { Group, GroupMember, ActivityItem } from '../types';

export const GroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setActiveGroup, removeGroup } = useGroupStore();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & State
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [emailInvite, setEmailInvite] = useState<string>('');
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  // Settings
  const [hideAmounts, setHideAmounts] = useState<boolean>(false);
  const [allowInvite, setAllowInvite] = useState(true);

  // Realtime socket connection


  const loadActivities = async () => {
    if (!groupId) return;
    try {
      const aRes = await groupApi.getActivity(groupId);
      setActivities(aRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadGroupData = async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const [gRes, mRes, aRes] = await Promise.all([
        groupApi.getDetail(groupId),
        groupApi.getMembers(groupId),
        groupApi.getActivity(groupId)
      ]);

      setGroup(gRes.data);
      setMembers(mRes.data || []);
      setActivities(aRes.data || []);
      setHideAmounts(gRes.data?.settings?.hideAmountsForMembers || false);
      setAllowInvite(gRes.data?.settings?.allowMemberInvite !== false);
    } catch (e: any) {
      alert(e.message || 'Không thể xem nhóm');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  useEffect(() => {
    const refresh = () => { void loadActivities(); };
    window.addEventListener('moneyflow:data-changed', refresh);
    return () => window.removeEventListener('moneyflow:data-changed', refresh);
  }, [groupId]);

  const handleCreateInviteCode = async () => {
    if (!groupId) return;
    setInviteLoading(true);
    try {
      const res = await groupApi.createInvite(groupId, { daysValid: 7, maxUses: 20 });
      setInviteCode(res.data.code);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInviteEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !emailInvite.trim() || inviteLoading) return;
    setInviteMessage('');
    setInviteError('');
    setInviteLoading(true);
    try {
      await groupApi.inviteByEmail(groupId, { email: emailInvite.trim() });
      setEmailInvite('');
      setInviteMessage('Đã gửi lời mời. Người nhận có thể xem và chấp nhận tại chuông thông báo.');
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateRole = async (memberUserId: string, newRole: string) => {
    if (!groupId) return;
    try {
      await groupApi.updateMemberRole(groupId, memberUserId, { role: newRole });
      loadGroupData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!groupId) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) {
      try {
        await groupApi.removeMember(groupId, memberUserId);
        loadGroupData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId) return;
    if (window.confirm('Bạn có chắc muốn rời khỏi nhóm này?')) {
      try {
        await groupApi.leaveGroup(groupId);
        removeGroup(groupId);
        navigate('/groups');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleSaveGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!groupId || !editName.trim() || editLoading) return;
    setEditLoading(true); setEditError('');
    try {
      const result = await groupApi.updateSettings(groupId, { name: editName.trim(), description: editDescription.trim() });
      setGroup(previous => previous ? { ...previous, name: result.data.name, description: result.data.description } : previous);
      const store = useGroupStore.getState();
      store.setGroups(store.groups.map(item => item._id === groupId ? { ...item, name: result.data.name, description: result.data.description } : item));
      if (store.activeGroupId === groupId) store.setActiveGroup(groupId, result.data.name, group?.myRole);
      setShowEditModal(false); setSavedMessage('Đã cập nhật thông tin nhóm.');
    } catch (error: any) { setEditError(error.message || 'Không thể cập nhật nhóm'); }
    finally { setEditLoading(false); }
  };

  const handleToggleHideAmounts = async (val: boolean) => {
    if (!groupId || settingsLoading) return;
    setSettingsLoading(true); setSettingsError('');
    try {
      await groupApi.updateSettings(groupId, { hideAmountsForMembers: val });
      setHideAmounts(val);
    } catch (error: any) { setSettingsError(error.message || 'Không thể lưu cài đặt. Vui lòng thử lại.'); }
    finally { setSettingsLoading(false); }
  };

  const handleAllowInvite = async () => {
    if (!groupId || settingsLoading) return;
    setSettingsLoading(true); setSettingsError('');
    try { await groupApi.updateSettings(groupId, { allowMemberInvite: !allowInvite }); setAllowInvite(value => !value); }
    catch (error: any) { setSettingsError(error.message || 'Không thể lưu thiết lập'); }
    finally { setSettingsLoading(false); }
  };

  if (loading) {
    return <div className="py-24 text-center text-xs text-slate-400">Đang tải chi tiết nhóm...</div>;
  }

  if (!group) return null;

  const isOwner = group?.myRole === 'owner';
  const isAdmin = group?.myRole === 'admin' || isOwner;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => navigate('/groups')} className="flex min-h-11 items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600"><ArrowLeft className="h-4 w-4" />Danh sách nhóm</button>
        <button type="button" onClick={() => { setActiveGroup(null); navigate('/dashboard'); }} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-semibold text-emerald-600 dark:bg-slate-900"><Wallet className="h-4 w-4" />Ví cá nhân</button>
      </div>
      {savedMessage && <p role="status" className="text-xs text-emerald-600 dark:text-emerald-400">{savedMessage}</p>}
      {/* Header Info */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
        <div className="flex w-full lg:w-auto lg:flex-1 min-w-0 items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-2xl shadow-lg">
            {group.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {group.name}
            </h1>
            <p className="break-words text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {group.description || 'Chưa có mô tả'}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                {isOwner ? 'Chủ nhóm' : (isAdmin ? 'Quản trị viên' : 'Thành viên')}
              </span>
              <span className="text-xs text-slate-400">
                {members.length} thành viên
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:shrink-0 [&>button]:flex-1 lg:[&>button]:flex-none">
          {isAdmin && <Button variant="border" size="sm" className="whitespace-nowrap" onClick={() => {
            setEditName(group.name); setEditDescription(group.description || ''); setEditError(''); setShowEditModal(true);
          }}><Pencil className="h-4 w-4" />Chỉnh sửa</Button>}
          {(isAdmin || allowInvite) && <Button
            variant="primary"
            size="sm"
            className="whitespace-nowrap"
            onClick={() => {
              setShowInviteModal(true);
              handleCreateInviteCode();
            }}
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Mời thành viên
          </Button>}

          {!isOwner && (
            <Button variant="danger" size="sm" onClick={handleLeaveGroup}>
              <LogOut className="w-4 h-4 mr-1.5" />
              Rời nhóm
            </Button>
          )}
        </div>
      </div>

      <button type="button" onClick={() => { setActiveGroup(group._id, group.name, group.myRole); navigate('/leaderboard'); }} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-left dark:border-emerald-900 dark:bg-emerald-950/20">
        <span className="flex items-center gap-3"><Trophy className="h-5 w-5 shrink-0 text-emerald-600" /><span><span className="block text-sm font-semibold">Hiệu quả bán hàng của nhóm</span><span className="block text-xs text-slate-500">Xếp hạng doanh thu, lãi gộp và số đơn theo tháng</span></span></span><span className="text-xs font-semibold text-emerald-600">Xem</span>
      </button>
      {/* Main Grid: Members & Realtime Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Members List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <span>Thành viên nhóm ({members.length})</span>
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((m) => {
                const memberUser = m.userId;
                const isThisUser = memberUser._id === user?._id;

                return (
                  <div key={m._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        src={memberUser.avatar}
                        alt={memberUser.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-1.5">
                          <span className="break-words">{memberUser.name}</span>
                          {isThisUser && <span className="text-[10px] text-emerald-600 font-bold">(Bạn)</span>}
                        </div>
                        <div className="mt-0.5 break-all text-xs text-slate-400">{memberUser.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-12 sm:pl-0 sm:shrink-0">
                      {isOwner && !isThisUser && m.role !== 'owner' ? (
                        <div className="w-44"><OptionPicker label={`Vai trò của ${memberUser.name}`} value={m.role} onChange={value => handleUpdateRole(memberUser._id, value)} options={[{ value: 'member', label: 'Thành viên' }, { value: 'admin', label: 'Quản trị viên' }]} /></div>
                      ) : (
                        <Badge variant={m.role === 'owner' ? 'warning' : (m.role === 'admin' ? 'info' : 'default')}>
                          {m.role === 'owner' ? 'Chủ nhóm' : (m.role === 'admin' ? 'Quản trị' : 'Thành viên')}
                        </Badge>
                      )}

                      {isAdmin && !isThisUser && m.role !== 'owner' && (isOwner || m.role === 'member') && (
                        <button
                          onClick={() => handleRemoveMember(memberUser._id)}
                          aria-label={`Xóa ${memberUser.name} khỏi nhóm`}
                          className="flex min-h-11 min-w-11 items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Xóa khỏi nhóm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy Settings (Owner Only) */}
          {isOwner && (
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" />
                <span>Cài Đặt Riêng Tư & Phân Quyền Nhóm</span>
              </h2>
              <div className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-slate-200/70 bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/40">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Ẩn số tiền chi tiết với thành viên thường
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Thành viên xem chi tiết dữ liệu do mình tạo; tổng nhóm và bảng xếp hạng vẫn được chia sẻ. Áp dụng cho thu chi, đơn bán, khách hàng, bảo hành và công nợ.
                  </div>
                </div>
                <button
                  type="button" role="switch" aria-checked={hideAmounts}
                  aria-label="Ẩn số tiền chi tiết với thành viên thường"
                  disabled={settingsLoading} onClick={() => handleToggleHideAmounts(!hideAmounts)}
                  className={`relative inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-full disabled:opacity-50 ${settingsLoading ? 'cursor-wait' : ''}`}
                >
                  <span aria-hidden="true" className={`flex h-6 w-11 items-center rounded-full border p-0.5 transition-colors ${hideAmounts ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700'}`}>
                    <span className={`h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform ${hideAmounts ? 'translate-x-5' : 'translate-x-0'}`} style={{ width: 18, height: 18 }} />
                  </span>
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                <div><p className="text-xs font-bold">Cho phép thành viên mời người khác</p><p className="mt-1 text-[11px] text-slate-500">Áp dụng cho cả mã mời và lời mời qua email.</p></div>
                <button type="button" role="switch" aria-label="Cho phép thành viên mời người khác" aria-checked={allowInvite} disabled={settingsLoading} onClick={handleAllowInvite} className="flex h-11 w-12 shrink-0 items-center justify-center disabled:opacity-50"><span aria-hidden="true" className={`flex h-6 w-11 items-center rounded-full border p-0.5 ${allowInvite ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700'}`}><span className={`h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${allowInvite ? 'translate-x-5' : ''}`} /></span></button>
              </div>
              {settingsLoading && <p role="status" className="mt-2 text-xs text-slate-500">Đang lưu cài đặt...</p>}
              {settingsError && <p role="alert" className="mt-2 text-xs text-rose-500">{settingsError}</p>}
            </div>
          )}
        </div>

        {/* Realtime Activity Feed (1 Col) */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-500" />
            <span>Dòng Hoạt Động (Realtime)</span>
          </h2>

          <div className="flex-1 max-h-[500px] overflow-y-auto space-y-2.5 pr-1">
            {activities.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Chưa có hoạt động mới trong nhóm
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {act.actor}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(act.createdAt, 'dd/MM HH:mm')}
                    </span>
                  </div>

                  <div className="text-slate-600 dark:text-slate-400">
                    {act.type === 'sale' ? (
                      <span>
                        Vừa bán: <strong>{act.productName}</strong> ({formatVND(act.amount)})
                      </span>
                    ) : (
                      <span>
                        Vừa ghi {act.action}: <strong>{act.title}</strong> ({formatVND(act.amount)})
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showEditModal} onClose={() => { if (!editLoading) setShowEditModal(false); }} title="Chỉnh sửa nhóm" maxWidth="max-w-md">
        <form onSubmit={handleSaveGroup} className="space-y-4">
          <Input label="Tên nhóm" value={editName} onChange={event => setEditName(event.target.value)} required maxLength={100} disabled={editLoading} />
          <div><label htmlFor="group-description" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Mô tả nhóm</label>
            <textarea id="group-description" rows={3} maxLength={1000} value={editDescription} disabled={editLoading} onChange={event => setEditDescription(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          </div>
          {editError && <p role="alert" className="text-sm text-rose-500">{editError}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button variant="secondary" disabled={editLoading} onClick={() => setShowEditModal(false)}>Hủy</Button>
            <Button type="submit" isLoading={editLoading} disabled={!editName.trim()}>Lưu thay đổi</Button>
          </div>
        </form>
      </Modal>
      {/* Invite Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Mời thành viên vào nhóm">
        <div className="space-y-5">
          {/* Invite Code Option */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
              Mã mời (Dùng để gia nhập nhanh)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteCode || 'Đang tạo mã...'}
                className="min-w-0 flex-1 text-center font-mono text-lg font-black tracking-widest py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(inviteCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 text-center">
              Mã có hiệu lực trong 7 ngày và tối đa 20 lượt tham gia.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            <span className="text-xs text-slate-400">hoặc</span>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          </div>

          {/* Email Invite Option */}
          <form onSubmit={handleInviteEmail} className="space-y-3">
            <Input
              label="Mời trực tiếp qua Email"
              type="email"
              placeholder="user@example.com"
              value={emailInvite}
              onChange={(e) => setEmailInvite(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Nhập email đã đăng ký trên hệ thống. Lời mời sẽ xuất hiện trong chuông thông báo của người nhận.</p>
            {inviteError && <p role="alert" className="text-sm text-rose-500">{inviteError}</p>}
            {inviteMessage && <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{inviteMessage}</p>}
            <Button type="submit" variant="primary" className="w-full" isLoading={inviteLoading}>
              Gửi lời mời trực tiếp
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
};
