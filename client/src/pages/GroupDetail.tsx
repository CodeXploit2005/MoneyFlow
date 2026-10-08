import { Avatar } from '../components/ui/Avatar';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatVND, formatDate } from '../utils/format';
import {
  Users,
  UserPlus,
  Trash2,
  LogOut,
  Activity,
  Copy,
  Check,
  Lock
} from 'lucide-react';
import { Group, GroupMember, ActivityItem } from '../types';

export const GroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & State
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [emailInvite, setEmailInvite] = useState<string>('');
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);

  // Settings
  const [hideAmounts, setHideAmounts] = useState<boolean>(false);

  // Realtime socket connection
  const socket = useSocket(groupId || null);

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
    if (!socket) return;

    // Realtime events
    socket.on('transaction:created', () => {
      loadActivities();
    });

    socket.on('sale:created', () => {
      loadActivities();
    });

    return () => {
      socket.off('transaction:created');
      socket.off('sale:created');
    };
  }, [socket]);

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
    if (!groupId || !emailInvite.trim()) return;
    setInviteLoading(true);
    try {
      await groupApi.inviteByEmail(groupId, { email: emailInvite.trim() });
      setEmailInvite('');
      alert('Đã gửi lời mời thành công!');
    } catch (err: any) {
      alert(err.message);
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
        navigate('/groups');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleToggleHideAmounts = async (val: boolean) => {
    if (!groupId) return;
    setHideAmounts(val);
    try {
      await groupApi.updateSettings(groupId, { hideAmountsForMembers: val });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-xs text-slate-400">Đang tải chi tiết nhóm...</div>;
  }

  if (!group) return null;

  const isOwner = group?.myRole === 'owner';
  const isAdmin = group?.myRole === 'admin' || isOwner;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-2xl shadow-lg">
            {group.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {group.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {group.description || 'Chưa có mô tả'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                Vai trò của bạn: {isOwner ? 'Chủ nhóm' : (isAdmin ? 'Quản trị viên' : 'Thành viên')}
              </span>
              <span className="text-xs text-slate-400">
                {members.length} thành viên
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowInviteModal(true);
              handleCreateInviteCode();
            }}
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Mời thành viên
          </Button>

          {!isOwner && (
            <Button variant="danger" size="sm" onClick={handleLeaveGroup}>
              <LogOut className="w-4 h-4 mr-1.5" />
              Rời nhóm
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Members & Realtime Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <span>Thành viên nhóm ({members.length})</span>
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((m) => {
                const memberUser = m.userId;
                const isThisUser = memberUser._id === user?._id;

                return (
                  <div key={m._id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={memberUser.avatar}
                        alt={memberUser.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{memberUser.name}</span>
                          {isThisUser && <span className="text-[10px] text-emerald-600 font-bold">(Bạn)</span>}
                        </div>
                        <div className="text-xs text-slate-400">{memberUser.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner && !isThisUser && m.role !== 'owner' ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleUpdateRole(memberUser._id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        >
                          <option value="member">Thành viên</option>
                          <option value="admin">Quản trị viên</option>
                        </select>
                      ) : (
                        <Badge variant={m.role === 'owner' ? 'warning' : (m.role === 'admin' ? 'info' : 'default')}>
                          {m.role === 'owner' ? 'Chủ nhóm' : (m.role === 'admin' ? 'Quản trị' : 'Thành viên')}
                        </Badge>
                      )}

                      {isAdmin && !isThisUser && m.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(memberUser._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" />
                <span>Cài Đặt Riêng Tư & Phân Quyền Nhóm</span>
              </h2>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Ẩn số tiền chi tiết với thành viên thường
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Thành viên thường chỉ xem được số tổng và bảng xếp hạng, không xem được chi tiết giao dịch của người khác.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={hideAmounts}
                  onChange={(e) => handleToggleHideAmounts(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Realtime Activity Feed (1 Col) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
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
                className="w-full text-center font-mono text-lg font-black tracking-widest py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400"
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
            <Button type="submit" variant="primary" className="w-full" isLoading={inviteLoading}>
              Gửi lời mời trực tiếp
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
};
