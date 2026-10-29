import React from 'react';

export default function CompanyForm({
  companyData,
  setCompanyData,
  savedUsers,
  handleImageUpload,
  handleCompanySubmit,
  setStep
}) {
  return (
    <div className="absolute inset-0 w-full h-full min-h-screen transition-all duration-300 ease-out transform font-cairo z-20 pointer-events-auto" dir="rtl">
      <div className="min-h-screen py-12 px-4 bg-slate-50 flex flex-col items-center justify-center relative overflow-y-auto h-full font-cairo">
        <div className="absolute top-6 right-6">
          <button 
            onClick={() => setStep('client-type')} 
            className="bg-white px-4 py-2 rounded-xl border border-slate-200 cursor-pointer font-medium hover:bg-slate-100 font-cairo"
          >
            ← الرجوع للخلف
          </button>
        </div>
        <div className="max-w-xl w-full bg-white p-8 rounded-3xl border shadow-xl my-8 font-cairo">
          <h2 className="text-2xl font-extrabold text-center mb-6">تسجيل الشركات</h2>
          <form onSubmit={handleCompanySubmit} className="space-y-4 font-cairo">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">صورة الشركة / الشعار (اختياري):</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => handleImageUpload(e, setCompanyData)} 
                className="w-full px-4 py-2 rounded-xl border text-xs bg-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 font-cairo" 
              />
            </div>
            <input 
              type="text" 
              required 
              placeholder="اسم الشركة" 
              value={companyData.name} 
              onChange={e => setCompanyData({...companyData, name: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
            />
            <input 
              type="text" 
              required 
              placeholder="اسم المستخدم" 
              value={companyData.username} 
              onChange={e => setCompanyData({...companyData, username: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
            />
            {savedUsers.some(u => u.username.toLowerCase() === companyData.username.trim().toLowerCase()) && companyData.username.trim() !== '' && (
              <p className="text-xs font-bold text-rose-600 mt-1">اسم المستخدم هذا مستخدم من قبل</p>
            )}
            <input 
              type="email" 
              required 
              placeholder="البريد الإلكتروني" 
              value={companyData.email} 
              onChange={e => setCompanyData({...companyData, email: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
            />
            <input 
              type="tel" 
              required 
              placeholder="رقم الهاتف" 
              value={companyData.phone} 
              onChange={e => setCompanyData({...companyData, phone: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
            />
            <input 
              type="password" 
              required 
              placeholder="كلمة المرور" 
              value={companyData.password} 
              onChange={e => setCompanyData({...companyData, password: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
            />
            <input 
              type="password" 
              required 
              placeholder="تأكيد كلمة المرور" 
              value={companyData.confirmPassword} 
              onChange={e => setCompanyData({...companyData, confirmPassword: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
            />
            {companyData.password && companyData.confirmPassword && companyData.password !== companyData.confirmPassword && (
              <p className="text-xs font-bold text-rose-600 mt-1">كلمة المرور وتأكيدها غير متطابقتين</p>
            )}
            <button 
              type="submit" 
              className="w-full py-3.5 bg-purple-700 text-white font-bold rounded-xl cursor-pointer font-cairo"
            >
              متابعة
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}