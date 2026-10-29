import React from 'react';

export default function IndividualForm({
  individualData,
  setIndividualData,
  savedUsers,
  handleImageUpload,
  handleIndividualSubmit,
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
          <h2 className="text-2xl font-extrabold text-center mb-6">تسجيل المستهلك / العميل</h2>
          <form onSubmit={handleIndividualSubmit} className="space-y-4 font-cairo">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">صورة الحساب (اختياري):</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => handleImageUpload(e, setIndividualData)} 
                className="w-full px-4 py-2 rounded-xl border text-xs bg-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 font-cairo" 
              />
            </div>
            <input 
              type="text" 
              required 
              placeholder="الاسم" 
              value={individualData.name} 
              onChange={e => setIndividualData({...individualData, name: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
            />
            <input 
              type="text" 
              required 
              placeholder="اسم المستخدم" 
              value={individualData.username} 
              onChange={e => setIndividualData({...individualData, username: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
            />
            {savedUsers.some(u => u.username.toLowerCase() === individualData.username.trim().toLowerCase()) && individualData.username.trim() !== '' && (
              <p className="text-xs font-bold text-rose-600 mt-1">اسم المستخدم هذا مستخدم من قبل</p>
            )}
            <input 
              type="email" 
              required 
              placeholder="البريد الإلكتروني" 
              value={individualData.email} 
              onChange={e => setIndividualData({...individualData, email: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
            />
            <input 
              type="tel" 
              required 
              placeholder="رقم الهاتف" 
              value={individualData.phone} 
              onChange={e => setIndividualData({...individualData, phone: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
            />
            <input 
              type="password" 
              required 
              placeholder="كلمة المرور" 
              value={individualData.password} 
              onChange={e => setIndividualData({...individualData, password: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
            />
            <input 
              type="password" 
              required 
              placeholder="تأكيد كلمة المرور" 
              value={individualData.confirmPassword} 
              onChange={e => setIndividualData({...individualData, confirmPassword: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm font-cairo" 
            />
            {individualData.password && individualData.confirmPassword && individualData.password !== individualData.confirmPassword && (
              <p className="text-xs font-bold text-rose-600 mt-1">كلمة المرور وتأكيدها غير متطابقتين</p>
            )}
            <button 
              type="submit" 
              className="w-full py-3.5 bg-purple-700 text-white font-bold rounded-xl cursor-pointer font-cairo"
            >
              متابعة للتحقق
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}