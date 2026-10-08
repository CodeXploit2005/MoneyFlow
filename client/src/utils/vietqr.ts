export interface VietBank {
  code: string;
  name: string;
  bin: string;
  logo: string;
}

// Ngân hàng hỗ trợ chuyển khoản theo api.vietqr.io/v2/banks, cập nhật 2026-10-07.
export const VIET_BANKS: VietBank[] = [
  {
    "code": "MB",
    "name": "MBBank - Ngân hàng TMCP Quân đội",
    "bin": "970422",
    "logo": "https://cdn.vietqr.io/img/MB.png"
  },
  {
    "code": "VCB",
    "name": "Vietcombank - Ngân hàng TMCP Ngoại Thương Việt Nam",
    "bin": "970436",
    "logo": "https://cdn.vietqr.io/img/VCB.png"
  },
  {
    "code": "TCB",
    "name": "Techcombank - Ngân hàng TMCP Kỹ thương Việt Nam",
    "bin": "970407",
    "logo": "https://cdn.vietqr.io/img/TCB.png"
  },
  {
    "code": "VPB",
    "name": "VPBank - Ngân hàng TMCP Việt Nam Thịnh Vượng",
    "bin": "970432",
    "logo": "https://cdn.vietqr.io/img/VPB.png"
  },
  {
    "code": "ACB",
    "name": "ACB - Ngân hàng TMCP Á Châu",
    "bin": "970416",
    "logo": "https://cdn.vietqr.io/img/ACB.png"
  },
  {
    "code": "ICB",
    "name": "VietinBank - Ngân hàng TMCP Công thương Việt Nam",
    "bin": "970415",
    "logo": "https://cdn.vietqr.io/img/ICB.png"
  },
  {
    "code": "BIDV",
    "name": "BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
    "bin": "970418",
    "logo": "https://cdn.vietqr.io/img/BIDV.png"
  },
  {
    "code": "VBA",
    "name": "Agribank - Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
    "bin": "970405",
    "logo": "https://cdn.vietqr.io/img/VBA.png"
  },
  {
    "code": "TPB",
    "name": "TPBank - Ngân hàng TMCP Tiên Phong",
    "bin": "970423",
    "logo": "https://cdn.vietqr.io/img/TPB.png"
  },
  {
    "code": "STB",
    "name": "Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín",
    "bin": "970403",
    "logo": "https://cdn.vietqr.io/img/STB.png"
  },
  {
    "code": "VIB",
    "name": "VIB - Ngân hàng TMCP Quốc tế Việt Nam",
    "bin": "970441",
    "logo": "https://cdn.vietqr.io/img/VIB.png"
  },
  {
    "code": "MSB",
    "name": "MSB - Ngân hàng TMCP Hàng Hải Việt Nam",
    "bin": "970426",
    "logo": "https://cdn.vietqr.io/img/MSB.png"
  },
  {
    "code": "SHB",
    "name": "SHB - Ngân hàng TMCP Sài Gòn - Hà Nội",
    "bin": "970443",
    "logo": "https://cdn.vietqr.io/img/SHB.png"
  },
  {
    "code": "ABB",
    "name": "ABBANK - Ngân hàng TMCP An Bình",
    "bin": "970425",
    "logo": "https://cdn.vietqr.io/img/ABB.png"
  },
  {
    "code": "BAB",
    "name": "BacABank - Ngân hàng TMCP Bắc Á",
    "bin": "970409",
    "logo": "https://cdn.vietqr.io/img/BAB.png"
  },
  {
    "code": "BVB",
    "name": "BaoVietBank - Ngân hàng TMCP Bảo Việt",
    "bin": "970438",
    "logo": "https://cdn.vietqr.io/img/BVB.png"
  },
  {
    "code": "CAKE",
    "name": "CAKE - TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank",
    "bin": "546034",
    "logo": "https://cdn.vietqr.io/img/CAKE.png"
  },
  {
    "code": "CIMB",
    "name": "CIMB - Ngân hàng TNHH MTV CIMB Việt Nam",
    "bin": "422589",
    "logo": "https://cdn.vietqr.io/img/CIMB.png"
  },
  {
    "code": "COOPBANK",
    "name": "COOPBANK - Ngân hàng Hợp tác xã Việt Nam",
    "bin": "970446",
    "logo": "https://cdn.vietqr.io/img/COOPBANK.png"
  },
  {
    "code": "EIB",
    "name": "Eximbank - Ngân hàng TMCP Xuất Nhập khẩu Việt Nam",
    "bin": "970431",
    "logo": "https://cdn.vietqr.io/img/EIB.png"
  },
  {
    "code": "HDB",
    "name": "HDBank - Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh",
    "bin": "970437",
    "logo": "https://cdn.vietqr.io/img/HDB.png"
  },
  {
    "code": "KBank",
    "name": "KBank - Ngân hàng Đại chúng TNHH Kasikornbank",
    "bin": "668888",
    "logo": "https://cdn.vietqr.io/img/KBANK.png"
  },
  {
    "code": "KLB",
    "name": "KienLongBank - Ngân hàng TMCP Kiên Long",
    "bin": "970452",
    "logo": "https://cdn.vietqr.io/img/KLB.png"
  },
  {
    "code": "LPB",
    "name": "LPBank - Ngân hàng TMCP Lộc Phát Việt Nam",
    "bin": "970449",
    "logo": "https://cdn.vietqr.io/img/LPB.png"
  },
  {
    "code": "MBV",
    "name": "MBV - Ngân hàng TNHH MTV Việt Nam Hiện Đại",
    "bin": "970414",
    "logo": "https://cdn.vietqr.io/img/MBV.png"
  },
  {
    "code": "NAB",
    "name": "NamABank - Ngân hàng TMCP Nam Á",
    "bin": "970428",
    "logo": "https://cdn.vietqr.io/img/NAB.png"
  },
  {
    "code": "NCB",
    "name": "NCB - Ngân hàng TMCP Quốc Dân",
    "bin": "970419",
    "logo": "https://cdn.vietqr.io/img/NCB.png"
  },
  {
    "code": "OCB",
    "name": "OCB - Ngân hàng TMCP Phương Đông",
    "bin": "970448",
    "logo": "https://cdn.vietqr.io/img/OCB.png"
  },
  {
    "code": "PGB",
    "name": "PGBank - Ngân hàng TMCP Thịnh vượng và Phát triển",
    "bin": "970430",
    "logo": "https://cdn.vietqr.io/img/PGB.png"
  },
  {
    "code": "PVCB",
    "name": "PVcomBank - Ngân hàng TMCP Đại Chúng Việt Nam",
    "bin": "970412",
    "logo": "https://cdn.vietqr.io/img/PVCB.png"
  },
  {
    "code": "PVDB",
    "name": "PVcomBank Pay - Ngân hàng TMCP Đại Chúng Việt Nam Ngân hàng số",
    "bin": "971133",
    "logo": "https://cdn.vietqr.io/img/PVCB.png"
  },
  {
    "code": "SGICB",
    "name": "SaigonBank - Ngân hàng TMCP Sài Gòn Công Thương",
    "bin": "970400",
    "logo": "https://cdn.vietqr.io/img/SGICB.png"
  },
  {
    "code": "SCB",
    "name": "SCB - Ngân hàng TMCP Sài Gòn",
    "bin": "970429",
    "logo": "https://cdn.vietqr.io/img/SCB.png"
  },
  {
    "code": "SEAB",
    "name": "SeABank - Ngân hàng TMCP Đông Nam Á",
    "bin": "970440",
    "logo": "https://cdn.vietqr.io/img/SEAB.png"
  },
  {
    "code": "SHBVN",
    "name": "ShinhanBank - Ngân hàng TNHH MTV Shinhan Việt Nam",
    "bin": "970424",
    "logo": "https://cdn.vietqr.io/img/SHBVN.png"
  },
  {
    "code": "TIMO",
    "name": "Timo - Ngân hàng số Timo by Ban Viet Bank (Timo by Ban Viet Bank)",
    "bin": "963388",
    "logo": "https://vietqr.net/portal-service/resources/icons/TIMO.png"
  },
  {
    "code": "Ubank",
    "name": "Ubank - TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank",
    "bin": "546035",
    "logo": "https://cdn.vietqr.io/img/UBANK.png"
  },
  {
    "code": "VAB",
    "name": "VietABank - Ngân hàng TMCP Việt Á",
    "bin": "970427",
    "logo": "https://cdn.vietqr.io/img/VAB.png"
  },
  {
    "code": "VIETBANK",
    "name": "VietBank - Ngân hàng TMCP Việt Nam Thương Tín",
    "bin": "970433",
    "logo": "https://cdn.vietqr.io/img/VIETBANK.png"
  },
  {
    "code": "VCCB",
    "name": "VietCapitalBank - Ngân hàng TMCP Bản Việt",
    "bin": "970454",
    "logo": "https://cdn.vietqr.io/img/VCCB.png"
  },
  {
    "code": "WVN",
    "name": "Woori - Ngân hàng TNHH MTV Woori Việt Nam",
    "bin": "970457",
    "logo": "https://cdn.vietqr.io/img/WVN.png"
  }
];

export interface VietQRParams {
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  amount?: number;
  description?: string;
  template?: string;
}

export const getVietQRUrl = ({
  bankCode,
  accountNumber,
  accountName,
  amount = 0,
  description = '',
  template = 'compact2'
}: VietQRParams): string => {
  if (!bankCode || !accountNumber) return '';
  const bank = VIET_BANKS.find(item => item.code.toLowerCase() === bankCode.trim().toLowerCase());
  const b = encodeURIComponent(bank?.bin || bankCode.trim());
  const a = encodeURIComponent(accountNumber.trim());
  const amt = Math.max(0, Math.round(Number(amount) || 0));
  const desc = encodeURIComponent(description.trim());
  const name = encodeURIComponent(accountName?.trim() || '');

  return `https://img.vietqr.io/image/${b}-${a}-${template}.png?amount=${amt}&addInfo=${desc}&accountName=${name}`;
};
