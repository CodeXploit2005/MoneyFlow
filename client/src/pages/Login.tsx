import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { authApi } from '../api/endpoints';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BankPicker } from '../components/ui/BankPicker';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { VIET_BANKS } from '../utils/vietqr';
import {
  Lock,
  Mail,
  User,
  CreditCard,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  QrCode,
  Users,
  Sun,
  Moon,
  CheckCircle2,
  ArrowRight,
  Zap,
  Clock,
  ShieldAlert
} from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state: any) => state.setAuth);
  const { theme, toggleTheme } = useThemeStore();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bankCode, setBankCode] = useState('MB');
  const [accountNumber, setAccountNumber] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegisterMode) {
        const selectedBank = VIET_BANKS.find(b => b.code === bankCode);
        const res = await authApi.register({
          name: name.trim(),
          email: email.trim(),
          password,
          bankInfo: {
            bankName: selectedBank?.name || 'MBBank',
            bankCode,
            accountNumber: accountNumber.trim(),
            accountName: name.trim().toUpperCase()
          }
        });
        setAuth(res.data.user, res.data.accessToken);
      } else {
        const res = await authApi.login({ email: email.trim(), password });
        setAuth(res.data.user, res.data.accessToken);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Thao tác không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors overflow-hidden">
      {/* LEFT COLUMN: Visual Showcase & Hero Presentation */}
      <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-12 bg-gradient-to-br from-white dark:from-slate-950 via-slate-50 dark:via-slate-900 to-emerald-100/60 dark:to-emerald-950/40 border-r border-slate-200 dark:border-slate-800/80 overflow-hidden">
        {/* Ambient Gradient Background Glows */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="text-slate-950 font-black text-2xl">M</span>
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
              MoneyFlow
            </span>
            <span className="text-[11px] block font-bold text-emerald-500 uppercase tracking-widest">
              Finance & Sales Ecosystem
            </span>
          </div>
        </div>

        {/* Center: Interactive Hero Showcase Cards */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span>Nền tảng tài chính & bán hàng số thế hệ mới</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
            Quản lý thu chi, bán hàng tài khoản &{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              bảo hành tự động
            </span>
          </h2>

          {/* Sống động: Mockup Glass Card */}
          <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            {/* Header Thẻ Doanh Thu */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="min-h-11 min-w-11 flex items-center justify-center p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Doanh thu tháng này</div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white">45.850.000 ₫</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                +35.4% tăng trưởng
              </span>
            </div>

            {/* Mockup Đơn bán & Bảo hành */}
            <div className="space-y-2 text-xs">
              {/* Đơn 1 */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Tài khoản Gemini Advanced (1 Năm)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Khách: Tuấn Anh • Lãi: +300.000 ₫</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                  Còn 355 ngày
                </span>
              </div>

              {/* Đơn 2 (Sắp hết hạn) */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <div className="font-bold text-amber-800 dark:text-amber-200">ChatGPT Plus (Chính chủ)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Khách: Thuỳ Dung • Tự động nhắc gia hạn</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Còn 2 ngày
                </span>
              </div>
            </div>

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Tự động tính lãi & vốn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>VietQR chuẩn Napas 247</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Bảng xếp hạng nhóm Realtime</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Dữ liệu lưu riêng cho từng tài khoản</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Trust Quote */}
        <div className="relative z-10 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Bảo mật dữ liệu riêng tư theo từng nhóm và cá nhân</span>
          </div>
          <span>v1.0 TypeScript Pro</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Form (Login / Register) */}
      <div className="w-full lg:w-5/12 flex flex-col justify-center px-6 sm:px-12 py-10 overflow-y-auto bg-white/60 dark:bg-slate-900/40">
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Top Bar on Mobile */}
          <div className="flex items-center justify-between lg:justify-end mb-2">
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950">
                M
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white">MoneyFlow</span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Form Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isRegisterMode ? 'Đăng ký tài khoản' : 'Chào mừng trở lại'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isRegisterMode
                ? 'Bắt đầu quản lý tài chính và bán hàng chuyên nghiệp'
                : 'Đăng nhập vào không gian làm việc của bạn'}
            </p>
          </div>

          {/* Switch Tab: Login vs Register */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setError(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                !isRegisterMode
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setError(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                isRegisterMode
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tạo tài khoản mới
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            {isRegisterMode && (
              <Input
                label="Họ và tên của bạn *"
                icon={User}
                placeholder="Ví dụ: Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <Input
              label="Địa chỉ Email *"
              type="email"
              icon={Mail}
              placeholder="tenban@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Mật khẩu *"
              type="password"
              icon={Lock}
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {/* Thông tin VietQR nếu đăng ký */}
            {!isRegisterMode && <div className="flex justify-end"><button type="button" onClick={() => setForgotOpen(true)} className="min-h-10 px-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">Quên mật khẩu?</button></div>}
            {isRegisterMode && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Ngân hàng nhận tiền (để tạo VietQR)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <BankPicker value={bankCode} onChange={setBankCode} />
                  <input
                    type="text"
                    aria-label="Số tài khoản nhận tiền"
                    maxLength={19}
                    pattern="[A-Za-z0-9]{1,19}"
                    title="Nhập số tài khoản hoặc biệt danh gồm chữ và số, tối đa 19 ký tự"
                    placeholder="Số tài khoản"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Nhập đúng tài khoản nhận tiền. Thông tin chưa được ngân hàng xác minh; người chuyển cần kiểm tra tên người nhận trong ứng dụng ngân hàng.</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-sm font-bold shadow-lg shadow-emerald-600/30"
              isLoading={loading}
            >
              <span>{isRegisterMode ? 'Đăng ký tài khoản' : 'Đăng nhập ngay'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Footer note */}
          <div className="text-center text-xs text-slate-500">
            {isRegisterMode ? (
              <span>
                Đã có tài khoản?{' '}
                <button
                  onClick={() => setIsRegisterMode(false)}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Đăng nhập
                </button>
              </span>
            ) : (
              <span>
                Chưa có tài khoản?{' '}
                <button
                  onClick={() => setIsRegisterMode(true)}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Đăng ký miễn phí
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} initialEmail={email} />
    </div>
  );
};
