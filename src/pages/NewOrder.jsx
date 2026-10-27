import React, { useState } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';

const EGYPT_GOVERNORATES_DATA = {
  "القاهرة": [
    "التجمع الخامس", "مدينة نصر", "المعادي", "مصر الجديدة", "الدقي", "المقطم", 
    "المهندسين", "شبرا", "عين شمس", "المرج", "حلوان", "المنيل", "الزمالك", "الروضة", "العباسية"
  ],
  "الجيزة": [
    "الشيخ زايد", "6 أكتوبر", "الهرم", "فيصل", "العجوزة", "البدرشين", 
    "أبو النمرس", "العياط", "الصف", "أطفيح", "كرداسة", "منشأة القناطر", "الوراق", "إمبابة"
  ],
  "الإسكندرية": [
    "الإسكندرية (وسط/شرق)", "منتزه أول", "منتزه ثان", "العامريّة", "العجمي", "البيطاش", "برج العرب", "ابيس"
  ],
  "القليوبية": [
    "بنها", "شبرا الخيمة", "قليوب", "قها", "الخصوص", "القناطر الخيرية", "الخانكة", "شبين القناطر", "كفر شكر", "طوخ"
  ],
  "الدقهلية": [
    "المنصورة", "طلخا", "ميت غمر", "دكرنس", "سنبلاوين", "أجا", "بلقاس", "المنزلة", "تمي الأمديد", "نبروه", "الجمالية", "شربين"
  ],
  "الشرقية": [
    "الزقازيق", "العاشر من رمضان", "بلبيس", "منيا القمح", "أبو كبير", "فاقوس", "ديرب نجم", "الحسينية", "كفر صقر", "أبو حماد", "الإبراهيمية", "ههيا", "مشتول السوق"
  ],
  "الغربية": [
    "طنطا", "المحلة الكبرى", "كفر الزيات", "زفتى", "السنطة", "بسيون", "سمنود", "قطور"
  ],
  "المنوفية": [
    "شبين الكوم", "منوف", "السادات", "الشهداء", "تلا", "سرس الليان", "أشمون", "قويسنا", "بركة السبع"
  ],
  "البحيرة": [
    "دمنهور", "كفر الدوار", "رشيد", "إيتاي البارود", "أبو حمص", "حوش عيسى", "كوم حمادة", "النوبارية الجديدة", "إدكو", "محمودية"
  ],
  "كفر الشيخ": [
    "كفر الشيخ", "دسوق", "فوة", "مطوبس", "بلطيم", "بيلا", "الحامول", "سيدي سالم", "قلين", "الرياض"
  ],
  "الدمياط": [
    "دمياط", "فارسكور", "الزرقا", "السرو", "كفر البطيخ", "رأس البر", "دمياط الجديدة", "عزبة البرج", "الروضة"
  ],
  "بورسعيد": [
    "بورسعيد (الأحياء)", "بورفؤاد", "المنطقة الحرة الاستثمارية"
  ],
  "الإسماعيلية": [
    "الإسماعيلية", "فايد", "القنطرة شرق", "القنطرة غرب", "التل الكبير", "أبو صوير", "القصاصين الجديدة"
  ],
  "السويس": [
    "السويس (الأحياء)", "العين السخنة"
  ],
  "الفيوم": [
    "مدينة الفيوم", "الفيوم الجديدة", "مركز الفيوم", "مركز سنورس", "مركز إطسا", "مركز أبشواي", "مركز طامية", "مركز يوسف الصديق"
  ],
  "بني سويف": [
    "بني سويف", "الواسطى", "ناصر", "إهناسيا", "ببا", "الفشن", "سمسطا", "بني سويف الجديدة"
  ],
  "المنيا": [
    "المنيا", "ملوي", "بني مزار", "سمالوط", "أبو قرقاص", "دير مواس", "مغاغة", "العدوة", "المنيا الجديدة"
  ],
  "أسيوط": [
    "أسيوط", "ديروط", "منفلوط", "أبو تيج", "الغنايم", "ساحل سليم", "البداري", "أبنوب", "صدفا", "أسيوط الجديدة"
  ],
  "سوهاج": [
    "سوهاج", "جرجا", "طهطا", "المراغة", "أخميم", "المنشأة", "جهينة", "دار السلام", "ساقلتة", "العسيرات"
  ],
  "قنا": [
    "قنا", "نجع حمادي", "دشنا", "قوص", "فرشوط", "ابوتشت", "قفط", "نقادة"
  ],
  "أسوان": [
    "أسوان", "إدفو", "كوم أمبو", "دراو", "أبو سمبل السياحية"
  ],
  "الأقصر": [
    "الأقصر", "إسنا", "أرمنت", "قرنة", "البياضية", "الزينية"
  ],
  "البحر الأحمر": [
    "الغردقة", "راس غارب", "سفاجا", "القصير", "مرسى علم", "شلاتين", "حلايب"
  ],
  "الوادي الجديد": [
    "الخارجة", "الداخلة", "باريس", "الفرافرة", "بلاط"
  ],
  "مطروح": [
    "مرسى مطروح", "الحمام", "الضبعة", "سيدي براني", "السلوم", "سيوة", "العلمين"
  ],
  "شمال سيناء": [
    "العريش", "الشيخ زويد", "رفح", "بئر العبد", "نخل", "الحسنة"
  ],
  "جنوب سيناء": [
    "تور سيناء", "شرم الشيخ", "دهب", "نويبع", "طابا", "سنت كاترين", "أبو رديس", "أبو زنيمة"
  ]
};

export default function NewOrder({ userData, onBack }) {
  const [currentStep, setCurrentStep] = useState(1);
  
  const [selectedGov, setSelectedGov] = useState('-');
  const [selectedCity, setSelectedCity] = useState('-');
  const [streetDetails, setStreetDetails] = useState('');

  const [serviceCategory, setServiceCategory] = useState('-');
  const [sparePartsBy, setSparePartsBy] = useState('-');
  const [description, setDescription] = useState('');
  
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const availableCities = selectedGov !== '-' ? EGYPT_GOVERNORATES_DATA[selectedGov] || [] : [];

  const handleNextStep = () => {
    setAttemptedNext(true);
    if (currentStep === 1) {
      if (
        selectedGov === '-' || 
        selectedCity === '-' || 
        !streetDetails.trim() || 
        serviceCategory === '-' || 
        sparePartsBy === '-' || 
        !description.trim()
      ) {
        return; 
      }
    }
    setAttemptedNext(false);
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setAttemptedNext(false);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async () => {
    if (!auth.currentUser) return;

    const fullAddress = `${selectedGov} - ${selectedCity} - ${streetDetails}`;

    try {
      setSubmitting(true);

      let assignedTechId = "";
      try {
        const techQuery = query(
          collection(db, "users"),
          where("userCategory", "==", "technician"),
          where("category", "==", serviceCategory)
        );
        const techSnapshot = await getDocs(techQuery);
        if (!techSnapshot.empty) {
          assignedTechId = techSnapshot.docs[0].id;
        }
      } catch (err) {
        console.warn("Could not auto-assign technician:", err);
      }

      await addDoc(collection(db, "orders"), {
        clientId: auth.currentUser.uid,
        clientName: userData?.fullName || 'عميل Orbix',
        clientImage: userData?.profileimage || userData?.profileImage || '',
        governorate: selectedGov,
        city: selectedCity,
        streetDetails,
        address: fullAddress,
        serviceCategory,
        category: serviceCategory,
        sparePartsBy,
        description,
        visitFee: 200,
        techId: assignedTechId,
        status: 'pending', // تم ضبطها لتطابق استعلام الفني
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى.");
      setSubmitting(false);
    }
  };

  const isGovInvalid = attemptedNext && selectedGov === '-';
  const isCityInvalid = attemptedNext && selectedCity === '-';
  const isStreetInvalid = attemptedNext && !streetDetails.trim();
  const isCategoryInvalid = attemptedNext && serviceCategory === '-';
  const isSparePartsInvalid = attemptedNext && sparePartsBy === '-';
  const isDescInvalid = attemptedNext && !description.trim();

  const fullAddressPreview = `${selectedGov !== '-' ? selectedGov : ''} ${selectedCity !== '-' ? '- ' + selectedCity : ''} ${streetDetails ? '- ' + streetDetails : ''}`;

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 font-cairo bg-cover bg-center bg-no-repeat overflow-hidden page-transition" 
      style={{ backgroundImage: `url(${bgWaves})` }} 
      dir="rtl"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-xl w-full max-h-[90vh] p-8 shadow-2xl border border-slate-100 flex flex-col relative overflow-y-auto">
        
        <div className="flex justify-start mb-2">
          <button 
            type="button" 
            onClick={onBack}
            className="text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <span>←</span>
            <span>العودة للصفحة الرئيسية</span>
          </button>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">طلب خدمة صيانة جديدة</h2>
          <p className="text-xs text-slate-500">اختر المحافظة والمدينة، واكتب عنوانك بالتفصيل (القرية والشارع والبيت)</p>
        </div>

        {success ? (
          <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
              ✅
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">تم إرسال طلبك بنجاح!</h3>
            <p className="text-xs text-slate-500">جاري توجيهك إلى الصفحة الرئيسية...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-around mb-8 px-4 relative shrink-0">
              
              <div className="relative z-10 flex flex-col items-center">
                <div className={`rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStep === 1 ? 'w-14 h-14 text-base bg-purple-700 text-white shadow-xl ring-4 ring-purple-100' :
                  currentStep > 1 ? 'w-9 h-9 text-xs bg-purple-700 text-white shadow-md' : 'w-9 h-9 text-xs bg-slate-200 text-slate-600'
                }`}>
                  {currentStep > 1 ? '✓' : '1'}
                </div>
                <span className={`text-[11px] mt-1.5 transition-all ${currentStep === 1 ? 'font-extrabold text-purple-900' : 'font-bold text-slate-600'}`}>الموقع والتفاصيل</span>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className={`rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStep === 2 ? 'w-14 h-14 text-base bg-purple-700 text-white shadow-xl ring-4 ring-purple-100' :
                  currentStep > 2 ? 'w-9 h-9 text-xs bg-purple-700 text-white shadow-md' : 'w-9 h-9 text-xs bg-slate-200 text-slate-600'
                }`}>
                  {currentStep > 2 ? '✓' : '2'}
                </div>
                <span className={`text-[11px] mt-1.5 transition-all ${currentStep === 2 ? 'font-extrabold text-purple-900' : 'font-bold text-slate-600'}`}>التكلفة والرسوم</span>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className={`rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStep === 3 ? 'w-14 h-14 text-base bg-purple-700 text-white shadow-xl ring-4 ring-purple-100' : 'w-9 h-9 text-xs bg-slate-200 text-slate-600'
                }`}>
                  3
                </div>
                <span className={`text-[11px] mt-1.5 transition-all ${currentStep === 3 ? 'font-extrabold text-purple-900' : 'font-bold text-slate-600'}`}>التأكيد</span>
              </div>
            </div>

            <div className="flex-1">
              
              {currentStep === 1 && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">المحافظة <span className="text-rose-500">*</span></label>
                    <select 
                      value={selectedGov} 
                      onChange={(e) => {
                        setSelectedGov(e.target.value);
                        setSelectedCity('-');
                      }}
                      className={`p-3 border rounded-xl text-xs outline-none bg-white transition ${
                        isGovInvalid ? 'border-rose-500 bg-rose-50 text-rose-600 font-bold' : 'border-slate-300 focus:border-purple-700'
                      }`}
                    >
                      <option value="-" disabled>-- اختر المحافظة --</option>
                      {Object.keys(EGYPT_GOVERNORATES_DATA).map((gov) => (
                        <option key={gov} value={gov} className="text-slate-900">{gov}</option>
                      ))}
                    </select>
                    {isGovInvalid && <span className="text-[10px] font-bold text-rose-600">يجب اختيار المحافظة</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">المدينة أو المركز <span className="text-rose-500">*</span></label>
                    <select 
                      value={selectedCity} 
                      onChange={(e) => setSelectedCity(e.target.value)}
                      disabled={selectedGov === '-'}
                      className={`p-3 border rounded-xl text-xs outline-none bg-white transition disabled:bg-slate-100 disabled:cursor-not-allowed ${
                        isCityInvalid ? 'border-rose-500 bg-rose-50 text-rose-600 font-bold' : 'border-slate-300 focus:border-purple-700'
                      }`}
                    >
                      <option value="-" disabled>-- اختر المدينة أو المركز --</option>
                      {availableCities.map((city) => (
                        <option key={city} value={city} className="text-slate-900">{city}</option>
                      ))}
                    </select>
                    {isCityInvalid && <span className="text-[10px] font-bold text-rose-600">يجب اختيار المدينة أو المركز</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">القرية، اسم الشارع، ورقم البيت / العقار <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="مثال: قرية قحافة، شارع الجمهورية، عمارة 5" 
                      value={streetDetails} 
                      onChange={(e) => setStreetDetails(e.target.value)}
                      className={`p-3 border rounded-xl text-xs outline-none bg-white transition ${
                        isStreetInvalid ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-300 focus:border-purple-700'
                      }`}
                    />
                    {isStreetInvalid && <span className="text-[10px] font-bold text-rose-600">تفاصيل العنوان إجبارية</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">قسم الصيانة <span className="text-rose-500">*</span></label>
                    <select 
                      value={serviceCategory} 
                      onChange={(e) => setServiceCategory(e.target.value)}
                      className={`p-3 border rounded-xl text-xs outline-none bg-white transition ${
                        isCategoryInvalid ? 'border-rose-500 bg-rose-50 text-rose-600 font-bold' : 'border-slate-300 focus:border-purple-700'
                      }`}
                    >
                      <option value="-" disabled>-- اختر القسم المطلوب --</option>
                      <option value="AC Maintenance">صيانة تكييفات</option>
                      <option value="Electricity">كهرباء</option>
                      <option value="Plumbing">سباكة</option>
                      <option value="IT">آي تي وتقنية</option>
                    </select>
                    {isCategoryInvalid && (
                      <span className="text-[10px] font-bold text-rose-600">يجب اختيار قسم الصيانة</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">كيف تريد أن يتم شراء قطع الغيار إذا لزم؟ <span className="text-rose-500">*</span></label>
                    <select
                      value={sparePartsBy}
                      onChange={(e) => setSparePartsBy(e.target.value)}
                      className={`p-3 border rounded-xl text-xs outline-none bg-white transition ${
                        isSparePartsInvalid ? 'border-rose-500 bg-rose-50 text-rose-600 font-bold' : 'border-slate-300 focus:border-purple-700'
                      }`}
                    >
                      <option value="-" disabled>-- اختر طريقة شراء قطع الغيار --</option>
                      <option value="tech" className="text-slate-900">الفني يجلبها بالفواتير الخاصة بالمعرض</option>
                      <option value="client" className="text-slate-900">أنا سأقوم بتوفيرها بنفسي</option>
                    </select>
                    {isSparePartsInvalid && (
                      <span className="text-[10px] font-bold text-rose-600">يجب اختيار طريقة توفير قطع الغيار</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">وصف تفصيلي للمشكلة <span className="text-rose-500">*</span></label>
                    <textarea 
                      rows="2"
                      placeholder="اكتب تفاصيل المشكلة والأعطال هنا..." 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                      className={`p-3 border rounded-xl text-xs outline-none bg-white resize-none transition ${
                        isDescInvalid ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-300 focus:border-purple-700'
                      }`}
                    />
                    {isDescInvalid && <span className="text-[10px] font-bold text-rose-600">وصف المشكلة إجباري</span>}
                  </div>

                </div>
              )}

              {currentStep === 2 && (
                <div className="flex flex-col gap-5 animate-fadeIn py-4">
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-700 text-white rounded-xl flex items-center justify-center text-xl shrink-0 font-extrabold">
                      💵
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-purple-900 mb-0.5">مصاريف زيارة ثابتة</h4>
                      <p className="text-[11px] text-purple-700 leading-relaxed">
                        يتم احتساب مبلغ وقدره <strong className="font-extrabold text-slate-900">200 جنيه</strong> مصاريف زيارة الفني وتقييم العطل للمنشأة.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">العنوان الكامل:</span>
                      <span className="font-bold text-slate-900">{fullAddressPreview}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">القسم:</span>
                      <span className="font-bold text-slate-900">{serviceCategory}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">قطع الغيار إذا لزم:</span>
                      <span className="font-bold text-slate-900">{sparePartsBy === 'tech' ? 'الفني يجلبها بالفواتير الخاصة بالمعرض' : 'العميل سيوفرها'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">مصاريف الزيارة:</span>
                      <span className="font-bold text-emerald-600">200 جنيه مصري</span>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="flex flex-col gap-4 animate-fadeIn py-6 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-2 shadow-inner">
                    ✨
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">جاهز لإرسال الطلب!</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    سيتم إرسال طلبك الآن إلى الفني المختص في قسم <strong className="text-slate-900">{serviceCategory}</strong> وسيظهر في لوحة المحادثات لديه تلقائياً.
                  </p>
                </div>
              )}

            </div>

            <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-100 shrink-0">
              {currentStep > 1 && (
                <button 
                  type="button" 
                  onClick={handlePrevStep}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  السابق
                </button>
              )}

              <div className="flex-1"></div>

              {currentStep < 3 ? (
                <button 
                  type="button" 
                  onClick={handleNextStep}
                  className="py-3 px-6 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
                >
                  التالي ←
                </button>
              ) : (
                <button 
                  type="button" 
                  disabled={submitting}
                  onClick={handleFinalSubmit}
                  className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submitting ? 'جاري التأكيد...' : 'تأكيد وإرسال الطلب الآن'}
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}