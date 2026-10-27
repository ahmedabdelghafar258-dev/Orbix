import React from 'react';

export default function VerifyCompanyEmail({
  companyVerificationCode,
  setCompanyVerificationCode,
  handleVerifyCompanySubmit,
  setStep
}) {
  return (
    <div className="absolute inset-0 w-full h-full min-h-screen transition-all duration-300 ease-out transform font-cairo z-20 pointer-events-auto" dir="rtl">
      <div className="min-h-screen py-12 px-4 bg-slate-50 flex flex-col items-center justify-center relative overflow-y-auto h-full font-cairo">
        <div className="absolute top-6 right-6">
          <button 
            onClick={() => setStep('company-form')} 
            className="bg-white px-4 py-2 rounded-xl border border-slate-200 cursor-pointer font-medium hover:bg-slate-100 font-cairo"
          >
            ← الرجوع للخلف
          </button>
        </div>
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border shadow-xl text-center font-cairo">
          <h2 className="text-2xl font-extrabold mb-2">التحقق من البريد الإلكتروني للشركة</h2>
          <form onSubmit={handleVerifyCompanySubmit} className="space-y-4 font-cairo">
            <input 
              type="text" 
              maxLength="4" 
              required 
              placeholder="رمز التحقق" 
              value={companyVerificationCode} 
              onChange={e => setCompanyVerificationCode(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border text-center text-xl font-bold font-cairo" 
            />
            <button 
              type="submit" 
              className="w-full py-3.5 bg-purple-700 text-white font-bold rounded-xl cursor-pointer font-cairo"
            >
              تأكيد حساب الشركة
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}