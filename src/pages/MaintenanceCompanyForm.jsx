import React from 'react';
import { egyptLocations } from '../Data/egyptLocations';

export default function MaintenanceCompanyForm({
  companyData,
  setCompanyData,
  savedUsers,
  handleImageUpload,
  handleCompanySubmit,
  setStep
}) {
  return (
    <div className="absolute inset-0 w-full h-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 overflow-y-auto font-cairo" dir="rtl">
      <div className="absolute top-6 right-6">
        <button 
          type="button"
          onClick={() => setStep('provider-type')} 
          className="bg-white px-4 py-2 rounded-xl border border-slate-200 cursor-pointer font-medium hover:bg-slate-100"
        >
          ← الرجوع للخلف
        </button>
      </div>

      <div className="max-w-xl w-full bg-white p-8 rounded-3xl border shadow-xl my-8">
        <h2 className="text-2xl font-extrabold text-center mb-6 text-slate-900">تسجيل شركة صيانة</h2>
        
        <form onSubmit={handleCompanySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">شعار الشركة أو اللوجو (اختياري):</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => handleImageUpload(e, setCompanyData)} 
              className="w-full px-4 py-2 rounded-xl border text-xs bg-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" 
            />
          </div>

          <input 
            type="text" 
            required 
            placeholder="اسم الشركة" 
            value={companyData?.name || ''} 
            onChange={e => setCompanyData({...companyData, name: e.target.value})} 
            className="w-full px-4 py-3 rounded-xl border text-sm" 
          />

          <div>
            <input 
              type="text" 
              required 
              placeholder="اسم المستخدم للشركة" 
              value={companyData?.username || ''} 
              onChange={e => setCompanyData({...companyData, username: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm" 
            />
            {savedUsers?.some(u => u.username?.toLowerCase() === companyData?.username?.trim().toLowerCase()) && companyData?.username?.trim() !== '' && (
              <p className="text-xs font-bold text-rose-600 mt-1">اسم المستخدم هذا مستخدم من قبل</p>
            )}
          </div>

          <input 
            type="email" 
            required 
            placeholder="البريد الإلكتروني للشركة" 
            value={companyData?.email || ''} 
            onChange={e => setCompanyData({...companyData, email: e.target.value})} 
            className="w-full px-4 py-3 rounded-xl border text-sm" 
          />

          <input 
            type="tel" 
            required 
            placeholder="رقم هاتف المسؤول / الشركة" 
            value={companyData?.phone || ''} 
            onChange={e => setCompanyData({...companyData, phone: e.target.value})} 
            className="w-full px-4 py-3 rounded-xl border text-sm" 
          />

          <select
            required
            value={companyData?.governorate || ''}
            onChange={e => setCompanyData({...companyData, governorate: e.target.value, city: ''})}
            className="w-full px-4 py-3 rounded-xl border text-sm bg-white"
          >
            <option value="">اختر المحافظة</option>
            {Object.keys(egyptLocations).map(gov => (
              <option key={gov} value={gov}>{gov}</option>
            ))}
          </select>

          {companyData?.governorate && (
            <select
              required
              value={companyData?.city || ''}
              onChange={e => setCompanyData({...companyData, city: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border text-sm bg-white"
            >
              <option value="">اختر المنطقة / المدينة</option>
              {egyptLocations[companyData.governorate]?.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          )}

          <input 
            type="password" 
            required 
            placeholder="كلمة المرور" 
            value={companyData?.password || ''} 
            onChange={e => setCompanyData({...companyData, password: e.target.value})} 
            className="w-full px-4 py-3 rounded-xl border text-sm" 
          />

          <div>
            <input 
              type="password" 
              required 
              placeholder="تأكيد كلمة المرور" 
              value={companyData?.confirmPassword || ''} 
              onChange={e => setCompanyData({...companyData, confirmPassword: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border text-sm" 
            />
            {companyData?.password && companyData?.confirmPassword && companyData.password !== companyData.confirmPassword && (
              <p className="text-xs font-bold text-rose-600 mt-1">كلمة المرور وتأكيدها غير متطابقتين</p>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl cursor-pointer transition shadow-md"
          >
            متابعة التسجيل
          </button>
        </form>
      </div>
    </div>
  );
}