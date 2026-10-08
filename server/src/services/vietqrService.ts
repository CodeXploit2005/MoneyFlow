export interface VietQRBank {
  code: string;
  name: string;
  bin: string;
}

export interface GenerateQRUrlOptions {
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  amount?: number;
  description?: string;
  template?: 'compact' | 'compact2' | 'qr_only' | 'print' | string;
}

export class VietQRService {
  /**
   * Danh sách mã ngân hàng VietQR phổ biến
   */
  static BANKS: VietQRBank[] = [
  {
    "code": "MB",
    "name": "MBBank - Ngân hàng TMCP Quân đội",
    "bin": "970422"
  },
  {
    "code": "VCB",
    "name": "Vietcombank - Ngân hàng TMCP Ngoại Thương Việt Nam",
    "bin": "970436"
  },
  {
    "code": "TCB",
    "name": "Techcombank - Ngân hàng TMCP Kỹ thương Việt Nam",
    "bin": "970407"
  },
  {
    "code": "VPB",
    "name": "VPBank - Ngân hàng TMCP Việt Nam Thịnh Vượng",
    "bin": "970432"
  },
  {
    "code": "ACB",
    "name": "ACB - Ngân hàng TMCP Á Châu",
    "bin": "970416"
  },
  {
    "code": "ICB",
    "name": "VietinBank - Ngân hàng TMCP Công thương Việt Nam",
    "bin": "970415"
  },
  {
    "code": "BIDV",
    "name": "BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
    "bin": "970418"
  },
  {
    "code": "VBA",
    "name": "Agribank - Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
    "bin": "970405"
  },
  {
    "code": "TPB",
    "name": "TPBank - Ngân hàng TMCP Tiên Phong",
    "bin": "970423"
  },
  {
    "code": "STB",
    "name": "Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín",
    "bin": "970403"
  },
  {
    "code": "VIB",
    "name": "VIB - Ngân hàng TMCP Quốc tế Việt Nam",
    "bin": "970441"
  },
  {
    "code": "MSB",
    "name": "MSB - Ngân hàng TMCP Hàng Hải Việt Nam",
    "bin": "970426"
  },
  {
    "code": "SHB",
    "name": "SHB - Ngân hàng TMCP Sài Gòn - Hà Nội",
    "bin": "970443"
  },
  {
    "code": "ABB",
    "name": "ABBANK - Ngân hàng TMCP An Bình",
    "bin": "970425"
  },
  {
    "code": "BAB",
    "name": "BacABank - Ngân hàng TMCP Bắc Á",
    "bin": "970409"
  },
  {
    "code": "BVB",
    "name": "BaoVietBank - Ngân hàng TMCP Bảo Việt",
    "bin": "970438"
  },
  {
    "code": "CAKE",
    "name": "CAKE - TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank",
    "bin": "546034"
  },
  {
    "code": "CIMB",
    "name": "CIMB - Ngân hàng TNHH MTV CIMB Việt Nam",
    "bin": "422589"
  },
  {
    "code": "COOPBANK",
    "name": "COOPBANK - Ngân hàng Hợp tác xã Việt Nam",
    "bin": "970446"
  },
  {
    "code": "EIB",
    "name": "Eximbank - Ngân hàng TMCP Xuất Nhập khẩu Việt Nam",
    "bin": "970431"
  },
  {
    "code": "HDB",
    "name": "HDBank - Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh",
    "bin": "970437"
  },
  {
    "code": "KBank",
    "name": "KBank - Ngân hàng Đại chúng TNHH Kasikornbank",
    "bin": "668888"
  },
  {
    "code": "KLB",
    "name": "KienLongBank - Ngân hàng TMCP Kiên Long",
    "bin": "970452"
  },
  {
    "code": "LPB",
    "name": "LPBank - Ngân hàng TMCP Lộc Phát Việt Nam",
    "bin": "970449"
  },
  {
    "code": "MBV",
    "name": "MBV - Ngân hàng TNHH MTV Việt Nam Hiện Đại",
    "bin": "970414"
  },
  {
    "code": "NAB",
    "name": "NamABank - Ngân hàng TMCP Nam Á",
    "bin": "970428"
  },
  {
    "code": "NCB",
    "name": "NCB - Ngân hàng TMCP Quốc Dân",
    "bin": "970419"
  },
  {
    "code": "OCB",
    "name": "OCB - Ngân hàng TMCP Phương Đông",
    "bin": "970448"
  },
  {
    "code": "PGB",
    "name": "PGBank - Ngân hàng TMCP Thịnh vượng và Phát triển",
    "bin": "970430"
  },
  {
    "code": "PVCB",
    "name": "PVcomBank - Ngân hàng TMCP Đại Chúng Việt Nam",
    "bin": "970412"
  },
  {
    "code": "PVDB",
    "name": "PVcomBank Pay - Ngân hàng TMCP Đại Chúng Việt Nam Ngân hàng số",
    "bin": "971133"
  },
  {
    "code": "SGICB",
    "name": "SaigonBank - Ngân hàng TMCP Sài Gòn Công Thương",
    "bin": "970400"
  },
  {
    "code": "SCB",
    "name": "SCB - Ngân hàng TMCP Sài Gòn",
    "bin": "970429"
  },
  {
    "code": "SEAB",
    "name": "SeABank - Ngân hàng TMCP Đông Nam Á",
    "bin": "970440"
  },
  {
    "code": "SHBVN",
    "name": "ShinhanBank - Ngân hàng TNHH MTV Shinhan Việt Nam",
    "bin": "970424"
  },
  {
    "code": "TIMO",
    "name": "Timo - Ngân hàng số Timo by Ban Viet Bank (Timo by Ban Viet Bank)",
    "bin": "963388"
  },
  {
    "code": "Ubank",
    "name": "Ubank - TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank",
    "bin": "546035"
  },
  {
    "code": "VAB",
    "name": "VietABank - Ngân hàng TMCP Việt Á",
    "bin": "970427"
  },
  {
    "code": "VIETBANK",
    "name": "VietBank - Ngân hàng TMCP Việt Nam Thương Tín",
    "bin": "970433"
  },
  {
    "code": "VCCB",
    "name": "VietCapitalBank - Ngân hàng TMCP Bản Việt",
    "bin": "970454"
  },
  {
    "code": "WVN",
    "name": "Woori - Ngân hàng TNHH MTV Woori Việt Nam",
    "bin": "970457"
  }
];

  /**
   * Tạo đường dẫn ảnh VietQR QuickLink chuẩn
   */
  static generateQRUrl({
    bankCode = 'MB',
    accountNumber = '',
    accountName = '',
    amount = 0,
    description = '',
    template = 'compact2'
  }: GenerateQRUrlOptions): string {
    if (!bankCode || !accountNumber) {
      return '';
    }

    const bank = this.BANKS.find(item => item.code.toLowerCase() === bankCode.trim().toLowerCase());
    const cleanBankCode = encodeURIComponent(bank?.bin || bankCode.trim());
    const cleanAccount = encodeURIComponent(accountNumber.trim());
    const cleanAmount = Math.max(0, Math.round(Number(amount) || 0));
    const cleanDesc = encodeURIComponent(description.trim());
    const cleanName = encodeURIComponent(accountName.trim());

    // VietQR Public QuickLink Endpoint
    return `https://img.vietqr.io/image/${cleanBankCode}-${cleanAccount}-${template}.png?amount=${cleanAmount}&addInfo=${cleanDesc}&accountName=${cleanName}`;
  }

  /**
   * Sinh mã nội dung chuyển khoản tiền tố MoneyFlow
   * Ví dụ: MF-DH6789
   */
  static generateTransferCode(prefix = 'MF', id = ''): string {
    const shortId = id.toString().slice(-6).toUpperCase();
    return `${prefix}-${shortId}`;
  }
}
export default VietQRService;
