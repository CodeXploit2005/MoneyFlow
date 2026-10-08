import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupApi } from '../api/endpoints';
import { useGroupStore } from '../store/groupStore';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Users, Plus, Key, ArrowRight, Trash2 } from 'lucide-react';
import { Group } from '../types';
import { Avatar } from '../components/ui/Avatar';
import { useAuthStore } from '../store/authStore';

export const Groups: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { activeGroupId, setActiveGroup, setGroups: syncGroups, removeGroup } = useGroupStore();

  const [groups, setGroups] = useState<Group[]>([]);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await groupApi.getMyGroups();
      setGroups(res.data || []);
      syncGroups(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setActionLoading(true);
    setError('');
    try {
      const res = await groupApi.createGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim()
      });
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      loadGroups();
      setActiveGroup(res.data._id, res.data.name, 'owner');
    } catch (err: any) {
      setError(err.message || 'Lỗi tạo nhóm');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setActionLoading(true);
    setError('');
    try {
      const res = await groupApi.joinByCode({ code: joinCode.trim() });
      setShowJoinModal(false);
      setJoinCode('');
      loadGroups();
      setActiveGroup(res.data._id, res.data.name, 'member');
      alert(`Tham gia nhóm "${res.data.name}" thành công!`);
    } catch (err: any) {
      setError(err.message || 'Lỗi tham gia nhóm');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Nhóm Cộng Tác & Bán Hàng</span>
            <Users className="w-6 h-6 text-emerald-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quản lý đội ngũ kinh doanh, phân quyền và xếp hạng thành viên
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowJoinModal(true)}>
            <Key className="w-4 h-4 mr-1.5" />
            Nhập mã mời
          </Button>

          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Tạo nhóm mới
          </Button>
        </div>
      </div>

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-20 text-center text-xs text-slate-400">Đang tải danh sách nhóm...</div>
        ) : groups.length === 0 ? (
          <div className="col-span-2 py-20 text-center text-slate-400 text-sm">
            Bạn chưa tham gia nhóm nào. Hãy tạo nhóm mới hoặc nhập mã mời để cộng tác cùng đồng đội!
          </div>
        ) : (
          groups.map((group) => {
            const isCurrent = activeGroupId === group._id;

            return (
              <div
                key={group._id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all ${
                  isCurrent
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-xl shadow-md">
                      {group.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {group.myRole === 'owner' ? '👑 Chủ nhóm' : (group.myRole === 'admin' ? '🛡️ Quản trị' : '👤 Thành viên')}
                        </span>
                        <span className="text-xs text-slate-400">
                          {group.memberCount} thành viên
                        </span>
                      </div>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                      Đang chọn
                    </span>
                  )}
                </div>

                {group.description && (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {group.description}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Button
                    variant={isCurrent ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveGroup(group._id, group.name, group.myRole)}
                  >
                    {isCurrent ? 'Đang kích hoạt' : 'Chọn nhóm này'}
                  </Button>

                  {group.myRole === 'owner' && <button type="button" aria-label={`Xóa nhóm ${group.name}`} onClick={() => { setDeletingGroup(group); setDeleteName(''); setDeleteError(''); }} className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/groups/${group._id}`)}
                  >
                    <span>Chi tiết & Thành viên</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={Boolean(deletingGroup)} onClose={() => setDeletingGroup(null)} title="Xóa nhóm" maxWidth="max-w-md">
        <div className="space-y-4"><p className="text-sm text-slate-500 dark:text-slate-400">Nhóm sẽ biến mất khỏi danh sách của mọi thành viên, mã mời ngừng hoạt động. Dữ liệu nghiệp vụ được giữ trong database, không chuyển sang ví cá nhân. Nhập tên nhóm để xác nhận.</p>
          <p className="font-semibold break-all">{deletingGroup?.name}</p><Input label="Tên nhóm xác nhận" value={deleteName} onChange={event => setDeleteName(event.target.value)} />
          {deleteError && <p role="alert" className="text-sm text-rose-500">{deleteError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDeletingGroup(null)}>Hủy</Button><Button variant="danger" disabled={!deletingGroup || deleteName !== deletingGroup.name} isLoading={actionLoading} onClick={async () => {
            if (!deletingGroup) return; setActionLoading(true); setDeleteError('');
            try { await groupApi.deleteGroup(deletingGroup._id); removeGroup(deletingGroup._id); setGroups(previous => previous.filter(group => group._id !== deletingGroup._id)); setDeletingGroup(null); await loadGroups(); }
            catch (error: any) { setDeleteError(error.message || 'Chưa xóa được nhóm'); } finally { setActionLoading(false); }
          }}>Xóa nhóm</Button></div>
        </div>
      </Modal>

      {/* Create Group Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Tạo nhóm cộng tác mới">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
            <Avatar src={user?.avatar} alt={user?.name || 'Chủ nhóm'} className="w-10 h-10 rounded-full object-cover" />
            <div className="min-w-0"><p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p><p className="text-xs text-slate-500">Bạn sẽ là chủ nhóm</p></div>
          </div>
          {error && <div className="p-3 text-xs text-rose-500 bg-rose-50 rounded-xl">{error}</div>}
          <Input
            label="Tên nhóm *"
            placeholder="Ví dụ: Team Sale MMO, Shop Account..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Mô tả nhóm
            </label>
            <textarea
              rows={3}
              placeholder="Mô tả mục tiêu hoạt động của nhóm..."
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading}>
              Tạo nhóm
            </Button>
          </div>
        </form>
      </Modal>

      {/* Join Group Modal */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Tham gia nhóm bằng mã mời">
        <form onSubmit={handleJoinGroup} className="space-y-4">
          {error && <div className="p-3 text-xs text-rose-500 bg-rose-50 rounded-xl">{error}</div>}
          <Input
            label="Mã mời (Invite Code) *"
            placeholder="Ví dụ: 8B9F2A1C"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setShowJoinModal(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading}>
              Tham gia ngay
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
