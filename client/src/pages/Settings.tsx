import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from '../components/ui/Avatar';
import { readAvatarFile } from '../utils/avatarUpload';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BankPicker } from '../components/ui/BankPicker';
import { VIET_BANKS, getVietQRUrl } from '../utils/vietqr';
import { Settings as SettingsIcon, CreditCard, Lock, User, Check, QrCode, Tag, FolderOpen } from 'lucide-react';
import { CategoriesTab } from './settings/CategoriesTab';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Profile info
  const [name, setName] = useState<string>(user?.name || '');
  const [avatar, setAvatar] = useState<string>(user?.avatar || '');
  const avatarFileInput = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Bank Info for VietQR
  const [bankCode, setBankCode] = useState<string>(user?.bankInfo?.bankCode || 'MB');
  const [accountNumber, setAccountNumber] = useState<string>(user?.bankInfo?.accountNumber || '');
  const [accountName, setAccountName] = useState<string>(user?.bankInfo?.accountName || user?.name || '');

  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileSuccess, setProfileSuccess] = useState<boolean>(false);

  // Change Password
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (avatarLoading) return;
    setProfileLoading(true);
    setProfileSuccess(false);

    try {
      const selectedBank = VIET_BANKS.find(b => b.code === bankCode);
      const res = await authApi.updateProfile({
        name: name.trim(),
        avatar: avatar.trim(),
        bankInfo: {
          bankName: selectedBank?.name || bankCode,
          bankCode,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim().toUpperCase()
        }
      });

      updateUser(res.data);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess(false);

    try {
      await authApi.changePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPasswordLoading(false);
    }
  };

  const previewQR = getVietQRUrl({
    bankCode,
    accountNumber,
    accountName,
    amount: 100000,
    description: 'MF-DEMO'
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <span>Cài Đặt Hệ Thống</span>
          <SettingsIcon className="w-6 h-6 text-emerald-500" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Quản lý hồ sơ, cấu hình tài khoản VietQR, danh mục thu chi và bảo mật
        </p>
      </div>

      {/* Tabs điều hướng */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Hồ sơ & VietQR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'categories'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Hệ thống Danh mục</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'security'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Bảo mật</span>
        </button>
      </div>

      {/* Tab Nội Dung: Danh mục */}
      {activeTab === 'categories' && <CategoriesTab />}

      {/* Tab Nội Dung: Hồ sơ & VietQR */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Profile & VietQR Settings (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Bank & Profile Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" />
              <span>Hồ sơ & Tài khoản VietQR</span>
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Đã cập nhật thông tin thành công!</span>
                </div>
              )}

              <Input
                label="Họ và tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="space-y-2">
                <label htmlFor="profile-avatar" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ảnh đại diện</label>
                <div className="flex items-center gap-3">
                  <Avatar src={avatar} alt="Ảnh đại diện xem trước" className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                  <div className="flex-1 min-w-0"><Input id="profile-avatar" value={avatar.startsWith('data:') ? '' : avatar} onChange={e => { setAvatar(e.target.value); setAvatarError(''); }} placeholder={avatar.startsWith('data:') ? 'Đã chọn ảnh từ tệp' : 'Dán link ảnh https://...'} /></div>
                  <button type="button" disabled={avatarLoading} onClick={() => avatarFileInput.current?.click()} title="Chọn ảnh từ tệp" aria-label="Chọn ảnh từ tệp" className="w-12 h-12 shrink-0 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 disabled:opacity-50"><FolderOpen className="w-5 h-5" /></button>
                </div>
                <input ref={avatarFileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async e => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; setAvatarLoading(true); setAvatarError(''); try { setAvatar(await readAvatarFile(file)); } catch (error: any) { setAvatarError(error.message); } finally { setAvatarLoading(false); } }} />
                <div className="flex justify-between items-center gap-2 text-xs text-slate-500"><span>{avatarLoading ? 'Đang xử lý ảnh…' : 'JPG, PNG, WebP · Tối đa 5 MB'}</span>{avatar && <button type="button" onClick={() => setAvatar('')} className="text-rose-500">Bỏ ảnh</button>}</div>
                {avatarError && <p role="alert" className="text-xs text-rose-500">{avatarError}</p>}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>Cấu hình thông tin nhận tiền chuyển khoản (VietQR)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Ngân hàng
                  </label>
                  <BankPicker value={bankCode} onChange={setBankCode} />
                </div>

                <Input
                  label="Số tài khoản ngân hàng"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Ví dụ: 0988888888"
                  required
                />

                <Input
                  label="Tên chủ tài khoản (Viết hoa không dấu)"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Ví dụ: NGUYEN VAN A"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" isLoading={profileLoading} disabled={avatarLoading}>
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Live VietQR Preview (1 Col) */}
        <div>
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm sticky top-24 text-center">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-1 flex items-center justify-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-500" />
              <span>Xem trước mã VietQR</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Mã này sẽ hiển thị khi bạn tạo khoản thu hoặc chia sẻ link
            </p>

            {accountNumber ? (
              <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <img
                  src={previewQR}
                  alt="VietQR Preview"
                  className="w-full h-auto object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="py-16 text-slate-400 text-xs">
                Chưa nhập số tài khoản ngân hàng
              </div>
            )}

            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-left space-y-1">
              <div>Ngân hàng: <strong>{bankCode}</strong></div>
              <div>Số TK: <strong>{accountNumber || 'Chưa nhập'}</strong></div>
              <div>Chủ TK: <strong className="uppercase">{accountName || name}</strong></div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Tab Nội Dung: Đổi mật khẩu & Bảo mật */}
      {activeTab === 'security' && (
        <div className="max-w-xl mx-auto">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-500" />
              <span>Đổi mật khẩu tài khoản</span>
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-medium border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Đổi mật khẩu thành công!</span>
                </div>
              )}

              <Input
                label="Mật khẩu hiện tại"
                placeholder="Nhập mật khẩu bạn đang sử dụng"
                autoComplete="current-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />

              <Input
                label="Mật khẩu mới (tối thiểu 6 ký tự)"
                placeholder="Tạo mật khẩu mới, ít nhất 6 ký tự"
                autoComplete="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Xác nhận mật khẩu mới"
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="secondary" isLoading={passwordLoading}>
                  Cập nhật mật khẩu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
