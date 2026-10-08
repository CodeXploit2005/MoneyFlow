import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Copy, Download, Check, Share2 } from 'lucide-react';
import { getVietQRUrl } from '../../utils/vietqr';
import { formatVND } from '../../utils/format';

interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankInfo?: any;
  amount?: number;
  description?: string;
  title?: string;
}

export const VietQRModal: React.FC<VietQRModalProps> = ({
  isOpen,
  onClose,
  bankInfo = {},
  amount = 0,
  description = '',
  title = 'Mã Chuyển Khoản VietQR'
}) => {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const [actionError, setActionError] = useState('');

  const bankCode = bankInfo?.bankCode || 'MB';
  const accountNumber = bankInfo?.accountNumber || '';
  const accountName = bankInfo?.accountName || '';

  const qrUrl = getVietQRUrl({
    bankCode,
    accountNumber,
    accountName,
    amount,
    description,
    template: 'compact2'
  });

  useEffect(() => { setQrFailed(false); setActionError(''); }, [qrUrl, isOpen]);

  const fetchQRFile = async () => {
    const response = await fetch(qrUrl);
    if (!response.ok) throw new Error('Không tải được mã QR');
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error('Mã QR không hợp lệ');
    return new File([blob], 'VietQR.png', { type: blob.type });
  };

  const handleCopy = async (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setActionError('Không sao chép được. Bạn có thể chọn và sao chép thông tin bên dưới.'); }
  };

  const handleDownloadQR = async () => {
    try {
      const blob = await fetchQRFile();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VietQR-${description || 'MoneyFlow'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(qrUrl, '_blank');
    }
  };

  const handleShare = async () => {
    setActionError('');
    if (navigator.share) {
      try {
        try {
          const file = await fetchQRFile();
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Mã nhận tiền VietQR' });
            return;
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
        }
        await navigator.share({
          title: 'Thanh toán đơn hàng qua VietQR',
          text: `Chuyển khoản ${formatVND(amount)} - Nội dung: ${description} tới số TK: ${accountNumber} (${bankCode})`,
          url: qrUrl
        });
      } catch (e) {
        if (!(e instanceof Error && e.name === 'AbortError')) setActionError('Không chia sẻ được. Hãy tải ảnh QR rồi gửi cho người chuyển tiền.');
      }
    } else {
      try {
        await navigator.clipboard.writeText(qrUrl);
        setActionError('Đã sao chép liên kết mã QR.');
      } catch { setActionError('Trình duyệt không hỗ trợ chia sẻ. Hãy dùng nút tải ảnh QR.'); }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 w-full flex justify-center">
          {accountNumber && !qrFailed ? (
            <img
              src={qrUrl}
              alt="VietQR QuickLink"
              className="max-h-72 w-auto object-contain rounded-lg"
              loading="lazy"
              onError={() => setQrFailed(true)}
            />
          ) : (
            <div className="py-12 text-slate-400 text-sm">
              {qrFailed ? 'Không tải được QR. Kiểm tra kết nối và thông tin ngân hàng, hoặc đóng rồi mở lại để thử.' : 'Chưa thiết lập số tài khoản ngân hàng trong hồ sơ cá nhân.'}
            </div>
          )}
        </div>

        <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-2.5 text-sm text-left mb-5 border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Ngân hàng:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {bankInfo?.bankName || bankCode}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Số tài khoản:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-slate-100">{accountNumber}</span>
              <button
                onClick={() => handleCopy(accountNumber, setCopiedAccount)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
              >
                {copiedAccount ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{accountName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Số tiền:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                {formatVND(amount)}
              </span>
              <button
                onClick={() => handleCopy(amount.toString(), setCopiedAmount)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
              >
                {copiedAmount ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400">Nội dung CK:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {description || 'MoneyFlow'}
              </span>
              <button
                onClick={() => handleCopy(description || 'MoneyFlow', setCopiedDesc)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
              >
                {copiedDesc ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-4">Trên cùng điện thoại, tải ảnh QR rồi chọn ảnh trong ứng dụng ngân hàng có hỗ trợ. Kiểm tra tên người nhận trước khi chuyển. Chỉ ghi nhận đã thu sau khi tiền về tài khoản.</p>
        {actionError && <p role="status" className="text-sm text-amber-600 mb-3">{actionError}</p>}
        <div className="flex w-full gap-2">
          <Button variant="secondary" onClick={handleDownloadQR} disabled={!qrUrl || qrFailed} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Tải ảnh QR
          </Button>

          <Button variant="outline" onClick={handleShare} disabled={!qrUrl || qrFailed} className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Chia sẻ
          </Button>
        </div>
      </div>
    </Modal>
  );
};
