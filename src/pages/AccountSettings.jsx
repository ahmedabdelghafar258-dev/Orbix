import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';

const EGYPT_GOVERNORATES_DATA = {
  "الفيوم": {
    "مركز الفيوم": [
      "حي شرق مدينة الفيوم", "حي غرب مدينة الفيوم", "المنشية", "دار الرماد", "حفناوي",
      "قرية دمو", "قرية العامرية", "قرية اللاهون", "قرية دمشقين", "قرية هوارة المقطع",
      "قرية هوارة عدلان", "قرية سيلا", "قرية دلاتون", "قرية منشأة لطف الله", "قرية كفر فلوكس",
      "قرية دملاش", "قرية الحامولي", "قرية زاوية الكرادسة", "قرية بني صالح", "قرية كفور النيل",
      "قرية قحافة", "قرية الشيخ فضل", "قرية العدوة", "قرية تلات", "قرية العزب",
      "قرية دهمشة", "قرية منشأة عبد الله", "قرية كفور حفناوي", "قرية فانوس",
      "قرية معصرة صاوي", "قرية سنهريس", "قرية كفرى المرابعين", "عزبة حبيب", "عزبة جاد الله"
    ],
    "مركز إطسا": [
      "مدينة إطسا", "قرية مطول", "قرية قصر الباسل", "قرية منية الحيط", "قرية دفنو",
      "قرية تطون", "قرية أبو جندير", "قرية قلمشاة", "قرية الغرق قبلي", "قرية الغرق بحري",
      "قرية قصر الجبالي", "قرية جردو", "قرية بحر أبو المير", "قرية معصرة صاوي", "قرية إهريت"
    ],
    "مركز سنورس": [
      "مدينة سنورس", "قرية جرفاس", "قرية سنهور القبلية", "قرية سنهور البحرية", "قرية بهمش",
      "قرية ترسا", "قرية نقالطة", "قرية بيت الله", "قرية مطرطارس القبلية", "قرية مطرطارس البحرية",
      "قرية السعيدية", "قرية فيدكيم", "قرية منشأة بنى عتمان", "قرية أبو عيطة"
    ],
    "مركز أبشواي": [
      "مدينة أبشواي", "قرية النصارية", "قرية طдаو", "قرية أبو غرارة", "قرية العجميين",
      "قرية سنرو القبلية", "قرية سنرو البحرية", "قرية الخالدية", "قرية شكشوك", "قرية أبو كساه"
    ],
    "مركز طامية": [
      "مدينة طامية", "قرية الروضة", "قرية دار السلام", "قرية فانوس", "قرية السراني",
      "قرية قصر رشوان", "قرية المظاطلي", "قرية منشأة الجمال", "قرية كفر محفوظ", "قرية الروبيات"
    ],
    "مركز يوسف الصديق": [
      "مدينة يوسف الصديق", "قرية النصر", "قرية قارون", "قرية الشواشنة", "قرية المشرك القبلي",
      "قرية المشرك البحري", "قرية الحامولي", "قرية الريان", "قرية غرقانة", "قرية الصبيحي"
    ],
    "الفيوم الجديدة": [
      "حي الحي الأول", "حي الحي الثاني", "حي الاستثماري", "منطقة الإسكان الاجتماعي", "منطقة المطورين"
    ]
  },
  "القاهرة": {
    "مدينة نصر": ["حي الألف مسكن", "حي رابعة العدوية", "حي الـ 8 عمارات", "حي السفارات", "عزبة الهجانة", "الحي السابع", "الحي العاشر"],
    "التجمع الخامس": ["الدبلوماسيين", "النرجس", "البنفسج", "المستثمرين الجنوبية", "المستثمرين الشمالية", "القطامية"],
    "المعادي": ["معادي ثكنات", "معادي السرايات", "المعادي الجديدة", "طريق صقر قريش", "دار السلام"],
    "مصر الجديدة": ["سلطان باشا", "الميرغني", "كوربة", "وهدان", "النزهة"],
    "الدقي": ["شارع مصدق", "شارع السودان", "شارع البطل أحمد عبد العزيز", "محي الدين أبو العز"],
    "المقطم": ["الهضبة الوسطى", "الهضبة العليا", "المقطم القديم", "التونسي"]
  },
  "الجيزة": {
    "الشيخ زايد": ["الحي الأول", "الحي الثاني", "الحي الـ 11", "بفرلي هيلز"],
    "6 أكتوبر": ["الحي الأول", "الحي المتميز", "الممشى السياحي", "حدائق الأهرام", "أبو رواش"],
    "الهرم": ["شارع الهرم الرئيسي", "الطالبية", "المريوطية", "المنشية", "كفر الجبل"],
    "فيصل": ["شارع فيصل الرئيسي", "المطبعة", "العريش", "الشارع الجديد", "التعاون"]
  },
  "الإسكندرية": {
    "منتزه أول": ["المندرة", "ميامي", "سيدي بشر", "العيسوي", "الفلكي"],
    "منتزه ثان": ["المعمورة", "أبي قير", "المنتزه"],
    "وسط الإسكندرية": ["محطة الرمل", "المنشية", "الإبراهيمية", "سموحة", "العطارين"]
  },
  "القليوبية": {
    "بنها": ["منشية النور", "فلل بنها", "الحرية", "كفر الجزار", "بطا"],
    "شبرا الخيمة": ["بيجام", "بهتيم", "مؤسسة الزكاة", "مسطرد"]
  },
  "الدقهلية": {
    "المنصورة": ["حي الجامعة", "توريل", "شارع الترعة", "سندوب", "مشلة"],
    "ميت غمر": ["دقادوس", "ميت غمر البلد", "بشلا", "سنفا"]
  },
  "الشرقية": {
    "الزقازيق": ["فلل الزقازيق", "القومية", "اتفاق", "النحال"],
    "العاشر من رمضان": ["المجاورة الأولى", "المجاورة العاشرة", "الأردني", "الابني"]
  },
  "الغربية": {
    "طنطا": ["شارع الاستاد", "سيجر", "المنشية الجديدة", "قطور"],
    "المحلة الكبرى": ["المنشية", "سكة زفتى", "الشون"]
  },
  "المنوفية": {
    "شبين الكوم": ["المساعي", "عووضة", "ميت خاقان", "الباجور"],
    "قويسنا": ["قويسنا البلد", "منشأة دملو"]
  },
  "البحيرة": {
    "دمنهور": ["أبو الريش", "سيدي مفتاح", "الإتحاد"],
    "كفر الدوار": ["المصنع", "أبو بكر الصديق", "السعرانية"]
  },
  "كفر الشيخ": {
    "كفر الشيخ": ["سيدي مبارك", "القنطرة البيضاء", "الاستاد"],
    "دسوق": ["دمنكة", "الكنيسة", "المحطة"]
  },
  "الدمياط": {
    "دمياط": ["الاعصار", "السنانية", "شطا", "عزبة البرج"],
    "رأس البر": ["اللجون", "القرية الأولمبية", "شارع 101"]
  },
  "بورسعيد": {
    "حي الشرق": ["شارع الجمهورية", "شارع التجاري"],
    "بورفؤاد": ["منطقة الإسكان التعاوني", "حي العقرب"]
  },
  "الإسماعيلية": {
    "الإسماعيلية": ["شارع طه حسين", "نفيشة", "الشهداء"]
  },
  "السويس": {
    "الأربعين": ["حي السواح", "حي الموشي"],
    "عتاقة": ["بورتوفيق", "الحرفيين"]
  },
  "بني سويف": {
    "بني سويف": ["الأستاد", "مقبل", "المرمد"],
    "الواسطى": ["الميمون", "إهناسيا الخضراء"]
  },
  "المنيا": {
    "المنيا": ["شلب", "أبسطة", "بوهلال"],
    "ملوي": ["الروضة", "البرشا"]
  },
  "أسيوط": {
    "أسيوط": ["الوليدية", "سنان", "غرب البلد"],
    "منفلوط": ["المعابدة", "بني رافع"]
  },
  "سوهاج": {
    "سوهاج": ["الشهيد فراج", "المحافظة", "إمبابة سوهاج"],
    "طهطا": ["شطورة", "القرعان"]
  },
  "قنا": {
    "قنا": ["المعنا", "الجبلاو"],
    "نجع حمادي": ["الجهاد", "بهجورة"]
  },
  "أسوان": {
    "أسوان": ["السيل", "الخزان", "شمال الصداقة"],
    "كوم أمبو": ["فارس", "إقليت"]
  },
  "الأقصر": {
    "الأقصر": ["الكرنك", "العوامية"],
    "إسنا": ["القرية الدبلوماسية", "الدير"]
  },
  "البحر الأحمر": {
    "الغردقة": ["الاحياء", "الكوثر", "حتا", "الشيراتون"]
  },
  "الوادي الجديد": {
    "الخارجة": ["بولاق", "المنيرة"]
  },
  "مطروح": {
    "مرسى مطروح": ["العوام", "الرميلة", "القصر"]
  },
  "شمال سيناء": {
    "العريش": ["الريسة", "مساعيد", "الزهور"]
  },
  "جنوب سيناء": {
    "شرم الشيخ": ["خليج نعمة", "نبق", "الرأس الركبة"],
    "دهب": ["الأسلة", "المشربة"]
  }
};

export default function NewOrder({ userData, onBack }) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // دالة آمنة لاستخراج العنوان مع دعم الحسابات القديمة التي لا تحتوي على عنوان
  const getInitialAddress = () => {
    try {
      const cached = localStorage.getItem('cachedUserData');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.address) {
          return {
            gov: parsed.address.governorate || '-',
            city: parsed.address.cityOrCenter || parsed.address.city || '-',
            street: parsed.address.streetDetails || ''
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    
    return {
      gov: userData?.address?.governorate || '-',
      city: userData?.address?.cityOrCenter || userData?.address?.city || '-',
      street: userData?.address?.streetDetails || ''
    };
  };

  const initialAddr = getInitialAddress();

  const [selectedGov, setSelectedGov] = useState(initialAddr.gov);
  const [selectedCity, setSelectedCity] = useState(initialAddr.city);
  const [streetDetails, setStreetDetails] = useState(initialAddr.street);

  const [serviceCategory, setServiceCategory] = useState('-');
  const [sparePartsBy, setSparePartsBy] = useState('-');
  const [description, setDescription] = useState('');
  
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // تحديث الحقول أوتوماتيكياً لو بيانات الـ userData اتحدثت
  useEffect(() => {
    const addr = userData?.address;
    if (addr) {
      if (addr.governorate) setSelectedGov(addr.governorate);
      if (addr.cityOrCenter || addr.city) setSelectedCity(addr.cityOrCenter || addr.city);
      if (addr.streetDetails) setStreetDetails(addr.streetDetails);
    }
  }, [userData]);

  const availableCities = selectedGov !== '-' ? Object.keys(EGYPT_GOVERNORATES_DATA[selectedGov] || {}) : [];

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

    const fullAddress = `${selectedGov}\n${selectedCity}\n${streetDetails}`;

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
        status: 'pending',
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
          <p className="text-xs text-slate-500">
            {userData?.address ? "تم تحديث عنوانك أوتوماتيكياً" : "يرجى اختيار وتحديد عنوانك لتتمكن من إرسال الطلب"}
          </p>
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
                <span className={`text-[11px] mt-1.5 transition-all ${currentStep === 1 ? 'font-extrabold text-purple-900' : 'font-bold text-slate-600'}`}>العنوان والتفاصيل</span>
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
                  
                  {userData?.address ? (
                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-purple-900 block mb-0.5">📍 العنوان الحالي (من الإعدادات):</span>
                        <span className="text-xs text-slate-700 font-medium">{fullAddressPreview || 'جاري تحميل العنوان...'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                      <span className="text-[11px] font-bold text-amber-900 block mb-0.5">⚠️ تنبيه للحسابات القديمة:</span>
                      <span className="text-xs text-amber-800">حسابك لا يحتوي على عنوان مسجل مسبقاً. يرجى اختيار العنوان أدناه لمرة واحدة وسيحفظ في إعداداتك.</span>
                    </div>
                  )}

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
                      placeholder="مثال: شارع الجمهورية، عمارة 5" 
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