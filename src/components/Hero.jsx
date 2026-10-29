import React from 'react';
import logo from '../assets/logo.png';
import bgWaves from '../assets/bg-waves.png';

function Hero({ onExploreFeatures }) {
  return (
    <section className="relative overflow-hidden bg-white min-h-screen flex flex-col items-center justify-start pt-0 pb-10">
      
      {/* خلفية الأمواج */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-90"
        style={{ backgroundImage: `url(${bgWaves})` }}
      ></div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center -mt-8 sm:-mt-12">
        
        {/* الشعار */}
        <div className="flex justify-center -mb-12">
          <img 
            src={logo} 
            alt="Orbix Logo" 
            className="w-56 h-56 sm:w-72 sm:h-72 object-contain drop-shadow-[0_15px_30px_rgba(147,51,234,0.3)] transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* النصوص والأزرار */}
        <div className="-mt-10 sm:-mt-14">
          
          <div className="inline-flex items-center gap-2 bg-white/80 border border-purple-200/80 px-3.5 py-1 rounded-full mb-4 text-xs sm:text-sm text-purple-900 shadow-sm backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-purple-600 animate-ping"></span>
            <span className="font-semibold">إطلاق منصة Orbix بحلتها الجديدة</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 leading-normal py-2">
            <span className="block mb-2">منصتك المتكاملة</span>
            <span className="bg-gradient-to-r from-purple-800 via-purple-600 to-indigo-600 bg-clip-text text-transparent block pb-2">
              لإدارة بنايتك بأمان
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-700 max-w-xl mx-auto mb-6 leading-relaxed font-medium">
            نوفر لك صيانة آمنة وسريعة لحياة أفضل.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button className="w-full sm:w-auto px-7 py-3 bg-purple-700 hover:bg-purple-800 text-white text-sm sm:text-base font-semibold rounded-xl transition duration-200 shadow-lg shadow-purple-600/30 hover:shadow-purple-700/40 transform hover:-translate-y-0.5 cursor-pointer">
              ابدأ تجاربك مجاناً
            </button>
            
            {/* زر استكشف المميزات الموصول بالوظيفة */}
            <button 
              onClick={onExploreFeatures}
              className="w-full sm:w-auto px-7 py-3 bg-white/90 hover:bg-white text-slate-800 text-sm sm:text-base border border-slate-200 font-semibold rounded-xl transition duration-200 shadow-sm hover:border-purple-300 backdrop-blur-sm cursor-pointer"
            >
              استكشف المميزات
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}

export default Hero;