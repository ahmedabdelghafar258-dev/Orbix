import React from 'react';

export default function PolicyModal({ policyModalType, setPolicyModalType }) {
  if (!policyModalType) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-cairo" dir="rtl">
      <div className="bg-white max-w-lg w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4 relative max-h-[85vh] overflow-y-auto font-cairo">
        <button 
          onClick={() => setPolicyModalType(null)} 
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold cursor-pointer"
        >
          ✕
        </button>
        <h3 className="text-xl font-extrabold text-slate-900 border-b pb-3">
          {policyModalType === 'about' && 'من نحن - منصة Orbix'}
          {policyModalType === 'policies' && 'سياستنا والشروط والعمولات'}
          {policyModalType === 'features' && 'مميزات منصة Orbix'}
          {policyModalType === 'contact' && 'تواصل معنا والدعم الفني'}
        </h3>
        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          {policyModalType === 'about' && <p>منصة Orbix هي الحل المتكامل لإدارة البنايات والمرافق في مصر، تربط بين المستهلكين وبين الفنيين وشركات الصيانة.</p>}
          {policyModalType === 'policies' && <p><strong>1. سياسة العمولات:</strong> تُخصم 2.5% من العميل و2.5% من مزود الخدمة وتذهب مباشرة لحساب الشركة.</p>}
          {policyModalType === 'features' && <p>أسعار صيانة ثابتة، تتبع دقيق للمراحل، إغلاق مزدوج، وفواتير معتمدة لقطع الغيار.</p>}
          {policyModalType === 'contact' && <p>للدعم الفني: support@orbix-eg.com أو الخط الساخن 19000.</p>}
        </div>
        <button 
          onClick={() => setPolicyModalType(null)} 
          className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl cursor-pointer text-sm mt-4 font-cairo"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}