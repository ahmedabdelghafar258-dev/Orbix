import React, { useState } from 'react';
import homeBg from '../assets/home.png';
import logo from '../assets/logo.png';

export default function Home({ setStep, isHomeMenuOpen, setIsHomeMenuOpen }) {
  // حالة لتحديد الصفحة النشطة حالياً داخل القائمة الجانبية (null يعني الصفحة الرئيسية)
  const [activePage, setActivePage] = useState(null);

  // دالة لإغلاق القائمة وانتقال العرض للصفحة المطلوبة
  const handleSelectPage = (pageName) => {
    setIsHomeMenuOpen(false);
    setActivePage(pageName);
  };

  return (
    <div 
      className="relative min-h-screen w-screen flex flex-col items-center justify-between p-6 font-cairo bg-cover bg-center bg-no-repeat overflow-x-hidden" 
      style={{ backgroundImage: `url(${homeBg})` }} 
      dir="rtl"
    >
      
      {/* ========================================== */}
      {/* لو الـ activePage مش فارغة، اعرض الصفحة الكاملة الخاصة بالقسم */}
      {/* ========================================== */}
      {activePage !== null ? (
        <div className="relative z-30 inset-0 min-h-screen w-full flex flex-col items-center justify-start py-8 px-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 flex flex-col relative min-h-[75vh]">
            
            {/* زر العودة للرئيسية */}
            <div className="flex justify-start mb-4">
              <button 
                type="button" 
                onClick={() => setActivePage(null)}
                className="text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>←</span>
                <span>العودة للرئيسية</span>
              </button>
            </div>

            {/* محتوى الصفحات المختلفة */}
            {activePage === 'about' && (
              <div className="flex flex-col gap-4 text-slate-800">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center text-2xl font-bold mb-2">ℹ️</div>
                <h2 className="text-2xl font-extrabold text-slate-900">من نحن</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  منصة <strong className="text-purple-700">Orbix</strong> هي المنصة الرائدة المخصصة لإدارة البنايات والمرافق بكفاءة عالية في جمهورية مصر العربية. نهدف إلى تسهيل حياة العملاء وأصحاب العقارات من خلال ربطهم المباشر بأفضل الفنيين وشركات الصيانة المعتمدة بكل سهولة، أمان، واحترافية.
                </p>
              </div>
            )}

            {activePage === 'services' && (
              <div className="flex flex-col gap-4 text-slate-800">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center text-2xl font-bold mb-2">🛠️</div>
                <h2 className="text-2xl font-extrabold text-slate-900">ماذا نقدم</h2>
                <ul className="flex flex-col gap-3 text-xs sm:text-sm text-slate-600 font-medium">
                  <li className="flex items-center gap-2">✅ صيانة المكيفات وتركيبها بأعلى جودة.</li>
                  <li className="flex items-center gap-2">✅ خدمات الكهرباء المنزلية والمنشآت.</li>
                  <li className="flex items-center gap-2">✅ خدمات السباكة وحل مشاكل التسريب والأعطال.</li>
                  <li className="flex items-center gap-2">✅ حلول وتقنيات الآي تي (IT) وتأمين المرافق.</li>
                  <li className="flex items-center gap-2">✅ نظام طلبات ذكي وتتبع فوري لزيارات الفنيين.</li>
                </ul>
              </div>
            )}

            {activePage === 'features' && (
              <div className="flex flex-col gap-4 text-slate-800">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center text-2xl font-bold mb-2">⭐</div>
                <h2 className="text-2xl font-extrabold text-slate-900">مميزاتنا</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <h4 className="font-bold text-xs text-purple-900 mb-1">سرعة الاستجابة</h4>
                    <p className="text-[11px] text-slate-500">توجيه طلبك لأقرب فني متاح في منطقتك فوراً.</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <h4 className="font-bold text-xs text-purple-900 mb-1">أسعار شفافة وثابتة</h4>
                    <p className="text-[11px] text-slate-500">رسوم زيارة واضحة وفواتير معتمدة لقطع الغيار.</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <h4 className="font-bold text-xs text-purple-900 mb-1">فنيين معتمدين</h4>
                    <p className="text-[11px] text-slate-500">نخبة من الكفاءات المهنية والموثوقة.</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <h4 className="font-bold text-xs text-purple-900 mb-1">تغطية واسعة</h4>
                    <p className="text-[11px] text-slate-500">نخدم جميع المحافظات والمدن والمراكز المصرية.</p>
                  </div>
                </div>
              </div>
            )}

            {activePage === 'contact' && (
              <div className="flex flex-col gap-4 text-slate-800">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center text-2xl font-bold mb-2">📞</div>
                <h2 className="text-2xl font-extrabold text-slate-900">اتصل بنا</h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  يسعدنا دائماً سماع آرائكم واستفساراتكم أو تلقي الشكاوي والاقتراحات على مدار الساعة.
                </p>
                <div className="flex flex-col gap-3 mt-2">
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs font-bold text-purple-900 flex items-center gap-2">
                    <span>📧 البريد الإلكتروني:</span> support@orbix.com
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs font-bold text-purple-900 flex items-center gap-2">
                    <span>📱 الخط الساخن:</span> 01000000000
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* العرض الأساسي للصفحة الرئيسية */
        <>
          {/* شريط التنقل العلوي - زر الثلاث خطوط على الشمال */}
          <div className="w-full max-w-6xl flex items-center justify-between z-20 py-4">
            <div className="flex items-center gap-2"></div>

            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => setIsHomeMenuOpen(true)}
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
        </>
      )}

      {/* ========================================== */}
      {/* --- القائمة الجانبية (Side Menu / Drawer) --- */}
      {/* ========================================== */}
      {isHomeMenuOpen && (
        <div 
          onClick={() => setIsHomeMenuOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      <div className={`fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isHomeMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* رأس القائمة */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-purple-700 text-white">
          <h3 className="font-extrabold text-base">قائمة Orbix</h3>
          <button 
            type="button"
            onClick={() => setIsHomeMenuOpen(false)}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* محتويات القائمة بالترتيب المطلوب */}
        <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          
          <button 
            type="button"
            onClick={() => handleSelectPage('about')}
            className="w-full text-right px-4 py-3 rounded-2xl hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold text-xs transition flex items-center gap-3 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm">ℹ️</span>
            <span>من نحن</span>
          </button>

          <button 
            type="button"
            onClick={() => handleSelectPage('services')}
            className="w-full text-right px-4 py-3 rounded-2xl hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold text-xs transition flex items-center gap-3 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm">🛠️</span>
            <span>ماذا نقدم</span>
          </button>

          <button 
            type="button"
            onClick={() => handleSelectPage('features')}
            className="w-full text-right px-4 py-3 rounded-2xl hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold text-xs transition flex items-center gap-3 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm">⭐</span>
            <span>مميزاتنا</span>
          </button>

          <button 
            type="button"
            onClick={() => handleSelectPage('contact')}
            className="w-full text-right px-4 py-3 rounded-2xl hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold text-xs transition flex items-center gap-3 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm">📞</span>
            <span>اتصل بنا</span>
          </button>

        </div>

        {/* أسفل القائمة */}
        <div className="p-4 border-t border-slate-100 text-center">
          <span className="text-[10px] text-slate-400 font-medium">Orbix Maintenance © 2026</span>
        </div>

      </div>

    </div>
  );
}