import React, { useEffect, useState } from 'react';
import { Mail, LockKeyhole, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { authApi } from '../../api/endpoints';

export const ForgotPasswordModal = ({ isOpen, onClose, initialEmail = '' }: { isOpen: boolean; onClose: () => void; initialEmail?: string }) => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'done'>('email');
  const [resetToken, setResetToken] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => { if (isOpen) { setStep('email'); setEmail(initialEmail); setCode(''); setResetToken(''); setPassword(''); setConfirm(''); setError(''); setCooldown(0); } }, [isOpen]);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(timer); }, [cooldown]);
  const send = async () => {
    setError(''); setBusy(true);
    try { await authApi.forgotPassword(email.trim()); setStep('otp'); setCode(''); setResetToken(''); setCooldown(60); }
    catch (error: any) { setError(error.response?.data?.message || error.message || 'Chưa gửi được mã. Thử lại sau.'); }
    finally { setBusy(false); }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step === 'email') { await send(); return; }
    if (step === 'otp') {
      setBusy(true); setError('');
      try { const response = await authApi.verifyResetOtp({email:email.trim(),code}); setResetToken(response.data.resetToken); setStep('reset'); }
      catch (error: any) { setError(error.response?.data?.message || error.message || 'Mã xác nhận không hợp lệ'); }
      finally { setBusy(false); }
      return;
    }
    if (password !== confirm) { setError('Mật khẩu xác nhận chưa khớp'); return; }
    setBusy(true); setError('');
    try { await authApi.resetPassword({ email: email.trim(), resetToken, password }); setResetToken(''); setStep('done'); }
    catch (error: any) { setError(error.response?.data?.message || error.message || 'Không đổi được mật khẩu'); }
    finally { setBusy(false); }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={step === 'done' ? 'Đã đổi mật khẩu' : 'Khôi phục mật khẩu'} maxWidth="max-w-md">
    {step === 'done' ? <div className="text-center space-y-5"><CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" /><p className="text-sm text-slate-500 dark:text-slate-400">Bạn có thể đăng nhập bằng mật khẩu mới. Các phiên đăng nhập cũ đã hết hiệu lực.</p><Button className="w-full" onClick={onClose}>Về đăng nhập</Button></div> : <form onSubmit={submit} className="space-y-5">
      <div className="flex items-start gap-3"><span className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><LockKeyhole className="w-6 h-6" /></span><p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{step === 'email' ? 'Nhập email đã đăng ký để nhận mã OTP khôi phục mật khẩu.' : step === 'reset' ? 'Email đã được xác thực. Đặt mật khẩu mới để bảo vệ tài khoản của bạn.' : <>Mã xác nhận đã được gửi đến <strong className="text-slate-800 dark:text-slate-200 break-all">{email}</strong> gồm 6 chữ số. Kiểm tra cả thư rác.</>}</p></div>
      <div className="flex gap-2" aria-label={step === 'email' ? 'Bước 1: nhập email' : step === 'otp' ? 'Bước 2: xác thực OTP' : 'Bước 3: đặt mật khẩu mới'}>{[0,1,2].map(index => <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= (step === 'email' ? 0 : step === 'otp' ? 1 : 2) ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'}`} />)}</div>
      {error && <p role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {step === 'email' ? <Input label="Email đã đăng ký" icon={Mail} type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="ban@email.com" required /> : step === 'otp' ? <>
        <div><label htmlFor="reset-otp" className="block text-sm font-medium mb-2">Mã xác nhận OTP</label><input id="reset-otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0,6))} placeholder="000000" required className="w-full h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center text-2xl tracking-[0.45em] font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" /><p className="text-xs text-slate-500 mt-2">Mã có hiệu lực 15 phút. Không chia sẻ mã với người khác.</p></div>
      </> : <>
        <Input label="Mật khẩu mới" type="password" autoComplete="new-password" minLength={6} maxLength={72} value={password} onChange={event => setPassword(event.target.value)} placeholder="Tối thiểu 6 ký tự" required />
        <Input label="Nhập lại mật khẩu mới" type="password" autoComplete="new-password" minLength={6} maxLength={72} value={confirm} onChange={event => setConfirm(event.target.value)} placeholder="Nhập lại mật khẩu vừa tạo" required />
      </>}
      <Button type="submit" className="w-full" isLoading={busy}>{step === 'email' ? 'Gửi mã xác nhận' : step === 'otp' ? 'Xác thực mã OTP' : 'Lưu mật khẩu mới'}<ArrowRight className="w-4 h-4 ml-2" /></Button>
      {step === 'otp' && <div className="flex justify-between gap-3 text-sm"><button type="button" disabled={busy} onClick={() => { setStep('email'); setResetToken(''); setCode(''); setError(''); }} className="text-slate-500 hover:text-emerald-600">Đổi email</button><button type="button" disabled={busy || cooldown > 0} onClick={send} className="font-semibold text-emerald-600 dark:text-emerald-400 disabled:text-slate-400">{cooldown ? `Gửi lại sau ${cooldown}s` : 'Gửi lại mã'}</button></div>}
      {step === 'reset' && <button type="button" disabled={busy} onClick={() => { setStep('email'); setResetToken(''); setCode(''); setPassword(''); setConfirm(''); setError(''); }} className="w-full text-sm text-slate-500 hover:text-emerald-600">Bắt đầu lại với mã mới</button>}
    </form>}
  </Modal>;
};
