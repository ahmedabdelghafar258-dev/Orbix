import React from 'react';

export default function ProviderType({ setStep }) {
  return (
    <div className="absolute inset-0 w-full h-full min-h-screen transition-all duration-300 ease-out transform font-cairo z-20 pointer-events-auto" dir="rtl">
      <div className="min-h-screen py-12 px-4 sm:px-6 bg-slate-50 flex flex-col items-center justify-center relative overflow-y-auto h-full font-cairo">
        <div className="absolute top-6 right-6">
          <button 
            onClick={() => setStep('register')} 
            className="bg-white px-4 py-2 rounded-xl border border-slate-200 cursor-pointer font-medium hover:bg-slate-100 font-cairo"
          >
            ← الرجوع للخلف
          </button>
        </div>
        <div className="max-w-2xl w-full text-center font-cairo">
          <h2 className="text-3xl font-extrabold mb-3">حسابات <span className="text-purple-700">مزودي الخدمة</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 hover:border-purple-600 shadow-sm flex flex-col justify-between text-center h-full">
              <div>
                <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto">🔧</div>
                <h3 className="text-xl font-bold mb-2">التسجيل للفنيين</h3>
              </div>
              <button 
                onClick={() => setStep('technician-form')} 
                className="w-full py-2.5 bg-purple-700 text-white font-semibold rounded-xl cursor-pointer mt-auto font-cairo"
              >
                متابعة للفنيين
              </button>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 hover:border-purple-600 shadow-sm flex flex-col justify-between text-center h-full">
              <div>
                <div className="w-16 h-16 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto">🏢</div>
                <h3 className="text-xl font-bold mb-2">التسجيل لشركات الصيانة</h3>
              </div>
              <button 
                onClick={() => setStep('maintenance-company-form')} 
                className="w-full py-2.5 bg-slate-900 text-white font-semibold rounded-xl cursor-pointer mt-auto font-cairo"
              >
                متابعة لشركات الصيانة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}