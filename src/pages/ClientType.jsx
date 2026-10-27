import React from 'react';
import BackButton from './BackButton';

export default function ClientType({ setStep }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-cairo relative" dir="rtl">
      
      {/* زرار الرجوع للخلف */}
      <div className="absolute top-6 right-6">
        <BackButton onClick={() => setStep('home')} />
      </div>

      <div className="max-w-3xl w-full text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">
          انضم إلى عائلة <span className="text-purple-700">Orbix</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* كارت مزود الخدمة (اللي على الشمال في صورتك) */}
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-slate-900 shadow-sm flex flex-col justify-between text-center transition-all duration-300">
            <div>
              <div className="w-16 h-16 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto">
                🛠️
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">التسجيل كمزود خدمة</h3>
              <p className="text-xs text-slate-500 mb-6">قدم خدمات الصيانة واستقبل طلبات العملاء المتاحة</p>
            </div>
            <button 
              onClick={() => setStep('provider-type')} 
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl cursor-pointer transition shadow-md"
            >
              اختر مزود الخدمة
            </button>
          </div>

          {/* كارت العميل (اللي على اليمين في صورتك) */}
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-purple-600 shadow-sm flex flex-col justify-between text-center transition-all duration-300">
            <div>
              <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto">
                🏢
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">التسجيل كعميل</h3>
              <p className="text-xs text-slate-500 mb-6">اطلب خدمات الصيانة لمنشأتك أو وحدتك بكل سهولة</p>
            </div>
            <button 
              onClick={() => setStep('provider-type')} 
              className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-2xl cursor-pointer transition shadow-md"
            >
              اختر العميل
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}