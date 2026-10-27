import React from 'react';

export default function WithdrawModal({
  providerWithdrawModal,
  setProviderWithdrawModal,
  withdrawMethod,
  setWithdrawMethod,
  withdrawAccountInput,
  setWithdrawAccountInput,
  withdrawAmount,
  setWithdrawAmount,
  providerBalances,
  clientName,
  handleProviderWithdrawSubmit
}) {
  if (!providerWithdrawModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-cairo" dir="rtl">
      <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4 font-cairo">
        <h3 className="text-xl font-bold text-slate-900 text-center">تحويل الأرباح للمحفظة أو إنستا باي 💸</h3>
        <div className="bg-emerald-50 p-3 rounded-2xl text-xs text-emerald-900 text-center">
          رصيدك الحالي المتاح للتحويل: <strong className="text-emerald-950 text-base">{providerBalances[clientName] || 0} ج.م</strong>
        </div>
        <form onSubmit={handleProviderWithdrawSubmit} className="space-y-4 font-cairo">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اختر وجهة التحويل بعد إتمام الخدمة:</label>
            <select 
              value={withdrawMethod} 
              onChange={e => setWithdrawMethod(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border text-sm bg-white font-bold text-purple-700 font-cairo border-slate-200"
            >
              <option value="--- اختر ---">--- اختر ---</option>
              <option value="المحفظة الشخصية">المحفظة الشخصية</option>
              <option value="انستا باي (InstaPay)">انستا باي (InstaPay)</option>
            </select>
          </div>

          {withdrawMethod === 'انستا باي (InstaPay)' ? (
            <div>
              <input 
                type="text" 
                required 
                placeholder="رقم انستا باي" 
                value={withdrawAccountInput} 
                onChange={(e) => setWithdrawAccountInput(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
              />
            </div>
          ) : withdrawMethod === 'المحفظة الشخصية' ? (
            <input 
              type="text" 
              required 
              placeholder="رقم المحفظة الشخصية" 
              value={withdrawAccountInput} 
              onChange={e => setWithdrawAccountInput(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
            />
          ) : null}

          <input 
            type="number" 
            required 
            placeholder="المبلغ المراد تحويله (ج.م)" 
            value={withdrawAmount} 
            onChange={e => setWithdrawAmount(e.target.value)} 
            className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
          />
          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setProviderWithdrawModal(false)} 
              className="w-1/2 py-3 bg-slate-200 rounded-xl font-bold text-xs cursor-pointer font-cairo"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              className="w-1/2 py-3 bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer font-cairo"
            >
              تأكيد التحويل ✓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}