import React from 'react';

export default function PaymentGatewayModal({
  paymentGatewayModal,
  setPaymentGatewayModal,
  chosenPaymentMethod,
  setChosenPaymentMethod,
  clientWallets,
  clientName,
  handlePaymentGatewaySubmit
}) {
  if (!paymentGatewayModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 font-cairo" dir="rtl">
      <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4 font-cairo">
        <h3 className="text-xl font-bold text-slate-900 text-center">إتمام الدفع الآمن</h3>
        <div className="bg-purple-50 p-3 rounded-2xl text-xs text-purple-900 space-y-1">
          <p><strong>المبلغ الأساسي (شامل قطع الغيار):</strong> {paymentGatewayModal.price} ج.م</p>
          <p><strong>عمولة المنصة للعميل (2.5%):</strong> {(Number(paymentGatewayModal.price) * 0.025).toFixed(2)} ج.م</p>
          <p className="font-extrabold text-sm text-purple-950 pt-1 border-t border-purple-200">الإجمالي المستحق: {(Number(paymentGatewayModal.price) * 1.025).toFixed(2)} ج.م</p>
        </div>
        <form onSubmit={handlePaymentGatewaySubmit} className="space-y-4 font-cairo">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اختر طريقة الدفع:</label>
            <select 
              value={chosenPaymentMethod} 
              onChange={e => setChosenPaymentMethod(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border text-sm bg-white font-bold text-purple-700 font-cairo border-slate-200"
            >
              <option value="--- اختر ---">--- اختر ---</option>
              <option value="المحفظة الشخصية">💳 الدفع مباشرة من المحفظة الشخصية (الرصيد المتاح: {clientWallets[clientName] || 0} ج.م)</option>
              <option value="انستا باي (InstaPay)">انستا باي (InstaPay)</option>
              <option value="فودافون كاش (Vodafone Cash)">فودافون كاش (Vodafone Cash)</option>
              <option value="الفيزا البنكية (Visa / Credit Card)">الفيزا البنكية (Visa / Credit Card)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => setPaymentGatewayModal(null)} 
              className="w-1/2 py-3 bg-slate-200 rounded-xl font-bold text-xs cursor-pointer font-cairo"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              className="w-1/2 py-3 bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer font-cairo"
            >
              تأكيد ودفع ✓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}