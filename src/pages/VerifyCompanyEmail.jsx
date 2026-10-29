import React from 'react';

export default function VerifyCompanyEmail({
  companyVerificationCode,
  setCompanyVerificationCode,
  handleVerifyCompanySubmit,
  setStep,
  onResendCode // اختياري لو حابب تضيف زرار إعادة إرسال
}) {
  return (
    <div className="absolute inset-0 w-full h-full min-h-screen transition-all duration-300 ease-out transform font-cairo z-20 pointer-events-auto" dir="rtl">
      <div className="min-h-screen py-12 px-4 bg-slate-50 flex flex-col items-center justify-center relative overflow-y-auto h-full font-cairo">
        <div className="absolute top-6 right-6">
          <button 
            type="button"
            onClick={() => setStep('company-form')} 
            className="bg-white px-4 py-2 rounded-xl border border-slate-200 cursor-pointer font-medium hover:bg-slate-100 font-cairo"
          >
            ← الرجوع للخلف
          </button>
        </div>
        
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border shadow-xl text-center font-cairo">
          <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
            ✉️
          </div>
          <h2 className="text-2xl font-extrabold mb-2 text-slate-900">التحقق من البريد الإلكتروني</h2>
          <p className="text-xs text-slate-500 mb-6">
            قم بإدخال كود التحقق المكون من 6 أرقام المرسل إلى بريدك الإلكتروني لتفعيل الحساب.
          </p>

          <form onSubmit={handleVerifyCompanySubmit} className="space-y-4 font-cairo">
            <input 
              type="text" 
              maxLength="6" 
              required 
              placeholder="1 2 3 4 5 6" 
              value={companyVerificationCode} 
              onChange={e => setCompanyVerificationCode(e.target.value)} 
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-center tracking-widest text-xl font-bold font-cairo bg-slate-50 focus:outline-none focus:border-purple-700" 
            />
            
            <button 
              type="submit" 
              className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl cursor-pointer font-cairo transition shadow-md"
            >
              تأكيد الحساب ✓
            </button>
          </form>

          {onResendCode && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={onResendCode}
                className="text-xs font-bold text-purple-700 hover:underline cursor-pointer"
              >
                لم يصلك الكود؟ إعادة إرسال
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}