import React from 'react';
import homeBg from '../assets/home.png';
import logo from '../assets/logo.png';

export default function Home({ setStep, isHomeMenuOpen, setIsHomeMenuOpen }) {
  return (
    <div 
      className="relative min-h-screen w-screen flex flex-col items-center justify-between p-6 font-cairo bg-cover bg-center bg-no-repeat overflow-x-hidden" 
      style={{ backgroundImage: `url(${homeBg})` }} 
      dir="rtl"
    >
      
      {/* شريط التنقل العلوي - زر القائمة على الشمال */}
      <div className="w-full max-w-6xl flex items-center justify-between z-20 py-4">
        <div className="flex items-center gap-2"></div>

        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => setIsHomeMenuOpen(!isHomeMenuOpen)}
            className="p-3 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm cursor-pointer hover:bg-white transition flex items-center justify-center"
          >
            <span className="text-xl font-bold text-slate-800">☰</span>
          </button>
        </div>
      </div>

      {/* المحتوى الرئيسي في المنتصف تماماً */}
      <div className="relative z-10 max-w-3xl w-full text-center my-auto flex flex-col items-center">
        
        {/* الشعار (logo.png) بالحجم الكبير الواضح */}
        <div className="mb-6 flex justify-center">
          <img 
            src={logo} 
            alt="Orbix Logo" 
            className="h-28 sm:h-36 w-auto object-contain drop-shadow-sm" 
          />
        </div>

        {/* العنوان والوصف */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            منصة <span className="text-purple-700">Orbix</span> لإدارة البنايات والمرافق
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-lg mx-auto">
            الحل المتكامل لربط العملاء بأفضل الفنيين وشركات الصيانة بكل سهولة وأمان.
          </p>
        </div>

        {/* الأزرار (تسجيل الدخول وانضم إلينا الآن) */}
        <div className="flex flex-row items-center justify-center gap-3 w-full max-w-sm">
          <button 
            type="button"
            onClick={() => setStep('signin')}
            className="flex-1 py-3 px-6 bg-white/90 hover:bg-white text-slate-800 font-bold rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition text-xs sm:text-sm"
          >
            تسجيل الدخول
          </button>

          <button 
            type="button"
            onClick={() => setStep('register')}
            className="flex-1 py-3 px-6 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-2xl shadow-md cursor-pointer transition text-xs sm:text-sm"
          >
            انضم إلينا الآن
          </button>
        </div>

      </div>

      {/* مساحة فارغة في الأسفل للحفاظ على التوازن */}
      <div className="relative z-10 py-4"></div>

    </div>
  );
}