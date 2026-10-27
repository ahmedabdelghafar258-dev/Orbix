import React from 'react';

export default function DepositModal({
  depositModalOpen,
  setDepositModalOpen,
  depositMethod,
  setDepositMethod,
  depositAmount,
  setDepositAmount,
  depositAccountInput,
  setDepositAccountInput,
  cardNumberInput,
  cardTypeDetected,
  handleCardNumberChange,
  handleWalletInput,
  handleDepositSubmit
}) {
  if (!depositModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-cairo" dir="rtl">
      <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4 font-cairo">
        <h3 className="text-xl font-bold text-slate-900 text-center">شحن رصيد المحفظة 💳</h3>
        <form onSubmit={handleDepositSubmit} className="space-y-4 font-cairo">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الإيداع والشحن:</label>
            <select 
              value={depositMethod} 
              onChange={e => setDepositMethod(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border text-sm bg-white font-cairo border-slate-200"
            >
              <option value="--- اختر ---">--- اختر ---</option>
              <option value="انستا باي (InstaPay)">انستا باي (InstaPay)</option>
              <option value="فودافون كاش (Vodafone Cash)">فودافون كاش (Vodafone Cash)</option>
              <option value="الفيزا البنكية (Visa)">الفيزا البنكية (Visa)</option>
            </select>
          </div>

          {(depositMethod.includes('فودافون كاش') || depositMethod.includes('انستا باي')) ? (
            <div>
              <input 
                type="text" 
                required 
                placeholder="رقم المحفظة أو الحساب" 
                value={depositAccountInput} 
                onChange={handleWalletInput} 
                className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
              />
              <p className="text-[10px] text-slate-400 mt-1">أدخل رقم الحساب أو الهاتف المراد الإيداع منه</p>
            </div>
          ) : depositMethod === 'الفيزا البنكية (Visa)' ? (
            <div>
              <input 
                type="text" 
                maxLength="19" 
                required 
                placeholder="رقم البطاقة (16 رقم مجمعة كل 4 أرقام)" 
                value={cardNumberInput} 
                onChange={handleCardNumberChange} 
                className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
              />
              {cardTypeDetected && <p className="text-xs text-purple-700 font-bold mt-1">{cardTypeDetected}</p>}
            </div>
          ) : null}

          <input 
            type="number" 
            required 
            placeholder="المبلغ المراد إيداعه (ج.م)" 
            value={depositAmount} 
            onChange={e => setDepositAmount(e.target.value)} 
            className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
          />
          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setDepositModalOpen(false)} 
              className="w-1/2 py-3 bg-slate-200 rounded-xl font-bold text-xs cursor-pointer font-cairo"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              className="w-1/2 py-3 bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer font-cairo"
            >
              تأكيد الإيداع ✓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}