import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { VietBank } from '../../utils/vietqr';
export const BankLogo = ({ bank, small = false }: { bank?: VietBank; small?: boolean }) => {
  const [failed, setFailed] = useState(false);
  return <span className={`${small ? 'h-7 w-10' : 'h-11 w-14'} shrink-0 flex items-center justify-center rounded-lg border border-slate-100 bg-white p-1.5`}>
    {bank?.logo && !failed ? <img src={bank.logo} alt="" loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-contain" /> : <CreditCard className="w-5 h-5 text-slate-400" />}
  </span>;
};
