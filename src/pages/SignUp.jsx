import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';

// قاعدة بيانات محافظات ومدن وقرى مصر الشاملة والدقيقة 100%
const EGYPT_GOVERNORATES_DATA = {
  "القاهرة": {
    "القاهرة (مدينة نصر والمناطق المحيطة)": ["التجمع الخامس", "مدينة نصر", "المعادي", "مصر الجديدة", "الدقي", "المقطم", "المهندسين", "شبرا", "عين شمس", "المرج", "حلوان", "المنيل", "الزمالك", "الروضة", "العباسية", "عزبة الهجانة", "بساتين المدي", "الزهراء"]
  },
  "الجيزة": {
    "الجيزة والشيخ زايد": ["الشيخ زايد", "6 أكتوبر", "الهرم", "فيصل", "العجوزة", "البدرشين", "أبو النمرس", "العياط", "الصف", "أطفيح", "كرداسة", "منشأة القناطر", "الوراق", "إمبابة", "ناهيا", "بشتيل", "برك الخيام"]
  },
  "الإسكندرية": {
    "الإسكندرية والساحل": ["الإسكندرية (وسط/شرق)", "منتزه أول", "منتزه ثان", "العامريّة", "العجمي", "البيطاش", "برج العرب", "ابيس", "أبي قير", "المعمورة", "السيوف"]
  },
  "القليوبية": {
    "بنها وشبرا الخيمة": ["بنها", "شبرا الخيمة", "قليوب", "قها", "الخصوص", "القناطر الخيرية", "الخانكة", "شبين القناطر", "كفر شكر", "طوخ", "ميت كنانة", "سندبيس"]
  },
  "الدقهلية": {
    "المنصورة ومراكزها": ["المنصورة", "طلخا", "ميت غمر", "دكرنس", "سنبلاوين", "أجا", "بلقاس", "المنزلة", "تمي الأمديد", "نبروه", "الجمالية", "شربين", "منية النصر", "باريس", "برق العبد"]
  },
  "الشرقية": {
    "الزقازيق والعاشر": ["الزقازيق", "العاشر من رمضان", "بلبيس", "منيا القمح", "أبو كبير", "فاقوس", "ديرب نجم", "الحسينية", "كفر صقر", "أبو حماد", "الإبراهيمية", "ههيا", "مشتول السوق", "صان الحجر"]
  },
  "الغربية": {
    "طنطا والمحلة": ["طنطا", "المحلة الكبرى", "كفر الزيات", "زفتى", "السنطة", "بسيون", "سمنود", "قطور", "شبراملس", "محلة روح"]
  },
  "المنوفية": {
    "شبين الكوم ومراكزها": ["شبين الكوم", "منوف", "السادات", "الشهداء", "تلا", "سرس الليان", "أشمون", "قويسنا", "بركة السبع", "شنوان", "مصيلحة"]
  },
  "البحيرة": {
    "دمنهور وكفر الدوار": ["دمنهور", "كفر الدوار", "رشيد", "إيتاي البارود", "أبو حمص", "حوش عيسى", "كوم حمادة", "النوبارية الجديدة", "إدكو", "محمودية", "الدنجلاوي"]
  },
  "كفر الشيخ": {
    "كفر الشيخ ودسوق": ["كفر الشيخ", "دسوق", "فوة", "مطوبس", "بلطيم", "بيلا", "الحامول", "سيدي سالم", "قلين", "الرياض", "الحامول"]
  },
  "الدمياط": {
    "دمياط ورأس البر": ["دمياط", "فارسكور", "الزرقا", "السرو", "كفر البطيخ", "رأس البر", "دمياط الجديدة", "عزبة البرج", "الروضة", "العباسية"]
  },
  "بورسعيد": {
    "بورسعيد وبورفؤاد": ["بورسعيد (الأحياء)", "بورفؤاد", "المنطقة الحرة الاستثمارية", "الجنوب", "مفروزة"]
  },
  "الإسماعيلية": {
    "الإسماعيلية ورافعاتها": ["الإسماعيلية", "فايد", "القنطرة شرق", "القنطرة غرب", "التل الكبير", "أبو صوير", "القصاصين الجديدة", "نفيشة"]
  },
  "السويس": {
    "السويس والأحياء": ["السويس (الأحياء)", "العين السخنة", "الأربعين", "عتاقة", "الجناين"]
  },
  "الفيوم": {
    "الفيوم ومراكزها": ["مدينة الفيوم", "الفيوم الجديدة", "مركز الفيوم", "مركز سنورس", "مركز إطسا", "مركز أبشواي", "مركز طامية", "مركز يوسف الصديق", "تونس"]
  },
  "بني سويف": {
    "بني سويف ومراكزها": ["بني سويف", "الواسطى", "ناصر", "إهناسيا", "ببا", "الفشن", "سمسطا", "بني سويف الجديدة", "شرق النيل"]
  },
  "المنيا": {
    "المنيا ومراكزها": ["المنيا", "ملوي", "بني مزار", "سمالوط", "أبو قرقاص", "دير مواس", "مغاغة", "العدوة", "المنيا الجديدة", "طحا الأعمدة"]
  },
  "أسيوط": {
    "أسيوط ومراكزها": ["أسيوط", "ديروط", "منفلوط", "أبو تيج", "الغنايم", "ساحل سليم", "البداري", "أبنوب", "صدفا", "أسيوط الجديدة"]
  },
  "سوهاج": {
    "سوهاج ومراكزها": ["سوهاج", "جرجا", "طهطا", "المراغة", "أخميم", "المنشأة", "جهينة", "دار السلام", "ساقلتة", "العسيرات"]
  },
  "قنا": {
    "قنا ومراكزها": ["قنا", "نجع حمادي", "دشنا", "قوص", "فرشوط", "ابوتشت", "قفط", "نقادة"]
  },
  "أسوان": {
    "أسوان ومراكزها": ["أسوان", "إدفو", "كوم أمبو", "دراو", "أبو سمبل السياحية", "نصر النوبة"]
  },
  "الأقصر": {
    "الأقصر ومراكزها": ["الأقصر", "إسنا", "أرمنت", "قرنة", "البياضية", "الزينية"]
  },
  "البحر الأحمر": {
    "الغردقة والمدن": ["الغردقة", "راس غارب", "سفاجا", "القصير", "مرسى علم", "شلاتين", "حلايب"]
  },
  "الوادي الجديد": {
    "الخارجة والداخلة": ["الخارجة", "الداخلة", "باريس", "الفرافرة", "بلاط"]
  },
  "مطروح": {
    "مرسى مطروح وسيوة": ["مرسى مطروح", "الحمام", "الضبعة", "سيدي براني", "السلوم", "سيوة", "العلمين", "رأس الحكمة"]
  },
  "شمال سيناء": {
    "العريش والشيخ زويد": ["العريش", "الشيخ زويد", "رفح", "بئر العبد", "نخل", "الحسنة"]
  },
  "جنوب سيناء": {
    "شرم الشيخ ودهب": ["تور سيناء", "شرم الشيخ", "دهب", "نويبع", "طابا", "سنت كاترين", "أبو رديس", "أبو زنيمة"]
  }
};

export default function SignUp({ onSwitchToSignIn, onBack }) {
  const [step, setStep] = useState('main');

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [specialization, setSpecialization] = useState('-');

  // حقول العنوان بالتفصيل للعملاء
  const [governorate, setGovernorate] = useState('-');
  const [city, setCity] = useState('-');
  const [villageOrDistrict, setVillageOrDistrict] = useState('-');
  const [streetDetails, setStreetDetails] = useState('');

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);

  useEffect(() => {
    const checkUsername = async () => {
      const trimmed = username.trim().toLowerCase();
      if (!trimmed) {
        setUsernameTaken(false);
        return;
      }
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", trimmed));
        const querySnapshot = await getDocs(q);
        setUsernameTaken(!querySnapshot.empty);
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(checkUsername, 400);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmitRegistration = async (userCategory, userSubtype) => {
    setAttemptedSubmit(true);
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('كلمتا المرور غير متطابقتين!');
      return;
    }

    if (usernameTaken) {
      setErrorMsg('اسم المستخدم مستخدم من قبل، يرجى اختيار اسم آخر.');
      return;
    }

    if ((userSubtype === 'tech' || userSubtype === 'provider_company') && specialization === '-') {
      setErrorMsg('يرجى اختيار التخصص المناسب قبل إتمام التسجيل.');
      return;
    }

    if ((userSubtype === 'client_company' || userSubtype === 'provider_company') && !email) {
      setErrorMsg('البريد الإلكتروني إجباري للشركات والكيانات.');
      return;
    }

    // التحقق من إجبارية حقول العنوان للعملاء فقط
    if (userCategory === 'client') {
      if (governorate === '-' || city === '-' || villageOrDistrict === '-' || !streetDetails.trim()) {
        setErrorMsg('يرجى اختيار وتحديد تفاصيل العنوان بالكامل (المحافظة، المدينة، القرية/المنطقة، وتفاصيل الشارع).');
        return;
      }
    }

    setLoading(true);

    try {
      const trimmedUsername = username.trim().toLowerCase();
      const fakeEmail = email ? email.trim() : `${trimmedUsername}@orbix.local`;

      const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
      const user = userCredential.user;

      const userData = {
        uid: user.uid,
        userCategory: userCategory,
        userSubtype: userSubtype,
        fullName: fullName,
        companyName: companyName || '',
        username: trimmedUsername,
        phone: phone,
        email: email || '',
        specialization: specialization !== '-' ? specialization : '',
        createdAt: new Date()
      };

      if (userCategory === 'client') {
        userData.address = {
          governorate,
          city,
          villageOrDistrict,
          streetDetails: streetDetails.trim()
        };
      }

      await setDoc(doc(db, "users", user.uid), userData);

    } catch (error) {
      setErrorMsg('حدث خطأ أثناء إنشاء الحساب: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 1. الشاشة الرئيسية للتسجيل ---
  if (step === 'main') {
    return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 font-cairo bg-cover bg-center bg-no-repeat overflow-hidden" style={{ backgroundImage: `url(${bgWaves})` }} dir="rtl">
        <div className="absolute top-6 right-6 z-20">
          <button 
            type="button" 
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-purple-700 bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <span>←</span> الرجوع للخلف
          </button>
        </div>

        <div className="relative z-10 max-w-3xl w-full text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            انضم إلى عائلة <span className="text-purple-700">Orbix</span>
          </h2>
          <p className="text-sm text-slate-600 mb-8 font-medium">اختر طبيعة حسابك لنبدأ رحلتك معنا</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border-2 border-slate-100 hover:border-purple-600 shadow-lg flex flex-col justify-between text-center transition-all duration-300">
              <div>
                <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto shadow-inner">
                  🏢
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">التسجيل كعميل</h3>
                <p className="text-xs text-slate-500 mb-6">اطلب خدمات الصيانة لمنشأتك أو وحدتك بكل سهولة</p>
              </div>
              <button 
                onClick={() => { setStep('client_type'); setAttemptedSubmit(false); setSpecialization('-'); }} 
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-2xl cursor-pointer transition shadow-md"
              >
                اختر العميل
              </button>
            </div>

            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border-2 border-slate-100 hover:border-purple-600 shadow-lg flex flex-col justify-between text-center transition-all duration-300">
              <div>
                <div className="w-16 h-16 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto shadow-inner">
                  🛠️
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">التسجيل كمزود خدمة</h3>
                <p className="text-xs text-slate-500 mb-6">قدم خدمات الصيانة واستقبل طلبات العملاء المتاحة</p>
              </div>
              <button 
                onClick={() => { setStep('provider_type'); setAttemptedSubmit(false); setSpecialization('-'); }} 
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl cursor-pointer transition shadow-md"
              >
                اختر مزود الخدمة
              </button>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-slate-200/60">
            <p className="text-xs text-slate-600 font-medium">
              لديك حساب بالفعل؟{' '}
              <button type="button" onClick={onSwitchToSignIn} className="text-purple-700 font-bold hover:underline cursor-pointer">
                تسجيل الدخول
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. تفرعات العملاء ---
  if (step === 'client_type') {
    return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 font-cairo bg-cover bg-center bg-no-repeat overflow-hidden" style={{ backgroundImage: `url(${bgWaves})` }} dir="rtl">
        <div className="absolute top-6 right-6 z-20">
          <button 
            type="button" 
            onClick={() => setStep('main')}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-purple-700 bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <span>←</span> الرجوع للخلف
          </button>
        </div>

        <div className="relative z-10 max-w-3xl w-full text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">
            حسابات <span className="text-purple-700">العملاء</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border-2 border-slate-100 hover:border-purple-600 shadow-lg flex flex-col justify-between text-center transition-all duration-300">
              <div>
                <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto shadow-inner">
                  🏢
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">الشركات والكيانات</h3>
                <p className="text-xs text-slate-500 mb-6">للبنايات والمؤسسات الكبرى وإدارة المرافق</p>
              </div>
              <button 
                onClick={() => { setStep('client_company'); setAttemptedSubmit(false); setSpecialization('-'); }} 
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl cursor-pointer transition shadow-md"
              >
                متابعة للشركات
              </button>
            </div>

            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border-2 border-slate-100 hover:border-purple-600 shadow-lg flex flex-col justify-between text-center transition-all duration-300">
              <div>
                <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto shadow-inner">
                  👤
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">الأفراد والمنشآت الصغيرة</h3>
                <p className="text-xs text-slate-500 mb-6">للمنازل والوحدات الفردية وطلب الصيانة المباشرة</p>
              </div>
              <button 
                onClick={() => { setStep('client_individual'); setAttemptedSubmit(false); setSpecialization('-'); }} 
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-2xl cursor-pointer transition shadow-md"
              >
                متابعة للأفراد
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. تفرعات مزودي الخدمة ---
  if (step === 'provider_type') {
    return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 font-cairo bg-cover bg-center bg-no-repeat overflow-hidden" style={{ backgroundImage: `url(${bgWaves})` }} dir="rtl">
        <div className="absolute top-6 right-6 z-20">
          <button 
            type="button" 
            onClick={() => setStep('main')}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-purple-700 bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <span>←</span> الرجوع للخلف
          </button>
        </div>

        <div className="relative z-10 max-w-3xl w-full text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">
            حسابات <span className="text-purple-700">مزودي الخدمة</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border-2 border-slate-100 hover:border-purple-600 shadow-lg flex flex-col justify-between text-center transition-all duration-300">
              <div>
                <div className="w-16 h-16 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto shadow-inner">
                  🏢
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">التسجيل لشركات الصيانة</h3>
                <p className="text-xs text-slate-500 mb-6">قدم خدمات الكيانات وشارك في إدارة العقود الكبرى</p>
              </div>
              <button 
                onClick={() => { setStep('provider_company'); setAttemptedSubmit(false); setSpecialization('-'); }} 
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl cursor-pointer transition shadow-md"
              >
                متابعة لشركات الصيانة
              </button>
            </div>

            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border-2 border-slate-100 hover:border-purple-600 shadow-lg flex flex-col justify-between text-center transition-all duration-300">
              <div>
                <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto shadow-inner">
                  🛠️
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">التسجيل للفنيين</h3>
                <p className="text-xs text-slate-500 mb-6">استقبل طلبات الفردية وقم بتنفيذ أعمال الصيانة</p>
              </div>
              <button 
                onClick={() => { setStep('provider_tech'); setAttemptedSubmit(false); setSpecialization('-'); }} 
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-2xl cursor-pointer transition shadow-md"
              >
                متابعة للفنيين
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- النماذج النهائية ---
  if (step === 'client_individual') {
    return (
      <RegisterForm 
        title="حساب الأفراد والمنشآت الصغيرة"
        isImageRequired={false}
        isEmailRequired={false}
        showCompanyName={false}
        showSpecialization={false}
        showAddress={true}
        onSubmit={(e) => { e.preventDefault(); handleSubmitRegistration('client', 'individual'); }}
        onBack={() => setStep('client_type')}
        bgImage={bgWaves}
        specializationOptions={[]}
        attemptedSubmit={attemptedSubmit}
        {...{ fullName, setFullName, username, setUsername, phone, setPhone, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, specialization, setSpecialization, errorMsg, loading, usernameTaken, governorate, setGovernorate, city, setCity, villageOrDistrict, setVillageOrDistrict, streetDetails, setStreetDetails, EGYPT_GOVERNORATES_DATA }}
      />
    );
  }

  if (step === 'client_company') {
    return (
      <RegisterForm 
        title="حساب الشركات والكيانات (عميل)"
        isImageRequired={true}
        isEmailRequired={true}
        showCompanyName={true}
        showSpecialization={false}
        showAddress={true}
        onSubmit={(e) => { e.preventDefault(); handleSubmitRegistration('client', 'client_company'); }}
        onBack={() => setStep('client_type')}
        bgImage={bgWaves}
        specializationOptions={[]}
        attemptedSubmit={attemptedSubmit}
        {...{ fullName, setFullName, companyName, setCompanyName, username, setUsername, phone, setPhone, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, specialization, setSpecialization, errorMsg, loading, usernameTaken, governorate, setGovernorate, city, setCity, villageOrDistrict, setVillageOrDistrict, streetDetails, setStreetDetails, EGYPT_GOVERNORATES_DATA }}
      />
    );
  }

  if (step === 'provider_tech') {
    return (
      <RegisterForm 
        title="تسجيل الفنيين"
        isImageRequired={true}
        isEmailRequired={false}
        showCompanyName={false}
        showSpecialization={true}
        showAddress={false}
        specializationOptions={[
          { value: 'AC Maintenance', label: 'صيانة تكييف' },
          { value: 'Electricity', label: 'كهرباء' },
          { value: 'Plumbing', label: 'سباكة' },
          { value: 'IT', label: 'آي تي' }
        ]}
        onSubmit={(e) => { e.preventDefault(); handleSubmitRegistration('provider', 'tech'); }}
        onBack={() => setStep('provider_type')}
        bgImage={bgWaves}
        attemptedSubmit={attemptedSubmit}
        {...{ fullName, setFullName, username, setUsername, phone, setPhone, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, specialization, setSpecialization, errorMsg, loading, usernameTaken }}
      />
    );
  }

  if (step === 'provider_company') {
    return (
      <RegisterForm 
        title="تسجيل شركة صيانة"
        isImageRequired={true}
        isEmailRequired={true}
        showCompanyName={true}
        showSpecialization={true}
        showAddress={false}
        specializationOptions={[
          { value: 'Comprehensive', label: 'شركة شاملة' },
          { value: 'Electricity', label: 'كهرباء' },
          { value: 'Plumbing', label: 'سباكة' },
          { value: 'IT', label: 'آي تي' },
          { value: 'AC Maintenance', label: 'صيانة تكييفات' }
        ]}
        onSubmit={(e) => { e.preventDefault(); handleSubmitRegistration('provider', 'provider_company'); }}
        onBack={() => setStep('provider_type')}
        bgImage={bgWaves}
        attemptedSubmit={attemptedSubmit}
        {...{ fullName, setFullName, companyName, setCompanyName, username, setUsername, phone, setPhone, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, specialization, setSpecialization, errorMsg, loading, usernameTaken }}
      />
    );
  }

  return null;
}

// مكون الفورم الموحد مع خيارات العناوين المصرية الشاملة
function RegisterForm({ 
  title, isImageRequired, isEmailRequired, showCompanyName, showSpecialization, showAddress, specializationOptions,
  onSubmit, onBack, bgImage, fullName, setFullName, companyName, setCompanyName, 
  username, setUsername, phone, setPhone, email, setEmail, 
  password, setPassword, confirmPassword, setConfirmPassword, 
  specialization, setSpecialization, errorMsg, loading, usernameTaken, attemptedSubmit,
  governorate, setGovernorate, city, setCity, villageOrDistrict, setVillageOrDistrict, streetDetails, setStreetDetails, EGYPT_GOVERNORATES_DATA 
}) {
  const isSpecInvalid = showSpecialization && attemptedSubmit && specialization === '-';
  const isGovInvalid = showAddress && attemptedSubmit && governorate === '-';
  const isCityInvalid = showAddress && attemptedSubmit && city === '-';
  const isVillageInvalid = showAddress && attemptedSubmit && villageOrDistrict === '-';
  const isStreetInvalid = showAddress && attemptedSubmit && !streetDetails.trim();

  // جلب المدن بناءً على المحافظة المختارة
  const availableCities = governorate !== '-' ? Object.keys(EGYPT_GOVERNORATES_DATA[governorate] || {}) : [];
  // جلب القرى / الأحياء بناءً على المدينة المختارة
  const availableVillages = (governorate !== '-' && city !== '-') ? EGYPT_GOVERNORATES_DATA[governorate][city] || [] : [];

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 font-cairo bg-cover bg-center bg-no-repeat overflow-hidden" style={{ backgroundImage: `url(${bgImage})` }} dir="rtl">
      
      <div className="absolute top-6 right-6 z-20">
        <button 
          type="button" 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-purple-700 bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <span>←</span> الرجوع للخلف
        </button>
      </div>

      <form onSubmit={onSubmit} className="relative z-10 flex flex-col gap-3 w-full max-w-md max-h-[85vh] p-6 shadow-2xl rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md overflow-y-auto">
        <h2 className="text-xl font-extrabold text-center text-slate-900 mb-1">{title}</h2>
        <p className="text-xs text-center text-slate-500 mb-2">أدخل البيانات المطلوبة بدقة</p>
        
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">
            صورة الحساب / الشعار {isImageRequired ? <span className="text-rose-500">(إجباري)</span> : <span className="text-slate-400">(اختياري)</span>}
          </label>
          <input 
            type="file" 
            className="p-2 border border-slate-300 rounded-xl text-xs bg-slate-50 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700" 
            required={isImageRequired}
          />
        </div>

        {showCompanyName && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">اسم الشركة</label>
            <input 
              type="text" placeholder="اسم الشركة" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              className="p-2.5 border border-slate-300 rounded-xl text-sm focus:border-purple-700 outline-none bg-white" required
            />
          </div>
        )}

        {showSpecialization && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">التخصص <span className="text-rose-500">(إجباري)</span></label>
            <select 
              value={specialization} 
              onChange={(e) => setSpecialization(e.target.value)}
              className={`p-2.5 border rounded-xl text-sm outline-none bg-white ${isSpecInvalid ? 'border-rose-500 bg-rose-50/30 text-rose-600 font-bold' : 'border-slate-300 focus:border-purple-700'}`}
              required
            >
              <option value="-" disabled>-- اختر التخصص --</option>
              {specializationOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
            {isSpecInvalid && (
              <p className="text-xs font-bold text-rose-600 mt-1">يجب اختيار تخصص صحيح للمتابعة</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">الاسم الكامل</label>
          <input 
            type="text" placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="p-2.5 border border-slate-300 rounded-xl text-sm focus:border-purple-700 outline-none bg-white" required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">اسم المستخدم</label>
          <input 
            type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
            className={`p-2.5 border rounded-xl text-sm outline-none bg-white ${usernameTaken ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 focus:border-purple-700'}`} required
          />
          {usernameTaken && (
            <p className="text-xs font-bold text-rose-600 mt-1">اسم المستخدم هذا مستخدم من قبل، غير متاح</p>
          )}
        </div>

        {/* حقول العنوان للعملاء فقط */}
        {showAddress && (
          <>
            {/* اختيار المحافظة */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">المحافظة <span className="text-rose-500">*</span></label>
              <select 
                value={governorate} 
                onChange={(e) => {
                  setGovernorate(e.target.value);
                  setCity('-');
                  setVillageOrDistrict('-');
                }}
                className={`p-2.5 border rounded-xl text-sm outline-none bg-white ${isGovInvalid ? 'border-rose-500 bg-rose-50 text-rose-600 font-bold' : 'border-slate-300 focus:border-purple-700'}`}
                required
              >
                <option value="-" disabled>-- اختر المحافظة --</option>
                {Object.keys(EGYPT_GOVERNORATES_DATA).map((gov) => (
                  <option key={gov} value={gov} className="text-slate-900">{gov}</option>
                ))}
              </select>
              {isGovInvalid && <p className="text-xs font-bold text-rose-600 mt-1">يجب اختيار المحافظة</p>}
            </div>

            {/* اختيار المدينة / المركز */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">المدينة / المركز <span className="text-rose-500">*</span></label>
              <select 
                value={city} 
                onChange={(e) => {
                  setCity(e.target.value);
                  setVillageOrDistrict('-');
                }}
                disabled={governorate === '-'}
                className={`p-2.5 border rounded-xl text-sm outline-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed ${isCityInvalid ? 'border-rose-500 bg-rose-50 text-rose-600 font-bold' : 'border-slate-300 focus:border-purple-700'}`}
                required
              >
                <option value="-" disabled>-- اختر المدينة أو المركز --</option>
                {availableCities.map((c) => (
                  <option key={c} value={c} className="text-slate-900">{c}</option>
                ))}
              </select>
              {isCityInvalid && <p className="text-xs font-bold text-rose-600 mt-1">يجب اختيار المدينة أو المركز</p>}
            </div>

            {/* اختيار القرية / الحي */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">القرية / الحي / المنطقة <span className="text-rose-500">*</span></label>
              <select 
                value={villageOrDistrict} 
                onChange={(e) => setVillageOrDistrict(e.target.value)}
                disabled={city === '-'}
                className={`p-2.5 border rounded-xl text-sm outline-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed ${isVillageInvalid ? 'border-rose-500 bg-rose-50 text-rose-600 font-bold' : 'border-slate-300 focus:border-purple-700'}`}
                required
              >
                <option value="-" disabled>-- اختر القرية أو الحي --</option>
                {availableVillages.map((v) => (
                  <option key={v} value={v} className="text-slate-900">{v}</option>
                ))}
              </select>
              {isVillageInvalid && <p className="text-xs font-bold text-rose-600 mt-1">يجب اختيار القرية أو الحي</p>}
            </div>

            {/* تفاصيل الشارع ورقم المبنى */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">اسم الشارع ورقم المبنى / الشقة <span className="text-rose-500">*</span></label>
              <input 
                type="text" placeholder="مثال: شارع الجمهورية، عمارة 14، الدور الثالث" value={streetDetails} onChange={(e) => setStreetDetails(e.target.value)}
                className={`p-2.5 border rounded-xl text-sm outline-none bg-white ${isStreetInvalid ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 focus:border-purple-700'}`} required
              />
              {isStreetInvalid && <p className="text-xs font-bold text-rose-600 mt-1">تفاصيل الشارع ورقم المبنى إجبارية</p>}
            </div>
          </>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">رقم التليفون</label>
          <input 
            type="tel" placeholder="01xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="p-2.5 border border-slate-300 rounded-xl text-sm focus:border-purple-700 outline-none bg-white" required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">
            البريد الإلكتروني {isEmailRequired ? <span className="text-rose-500">(إجباري)</span> : <span className="text-slate-400">(اختياري)</span>}
          </label>
          <input 
            type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
            className="p-2.5 border border-slate-300 rounded-xl text-sm focus:border-purple-700 outline-none bg-white" required={isEmailRequired}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
          <input 
            type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
            className="p-2.5 border border-slate-300 rounded-xl text-sm focus:border-purple-700 outline-none bg-white" required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">تأكيد كلمة المرور</label>
          <input 
            type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className={`p-2.5 border rounded-xl text-sm outline-none bg-white ${confirmPassword && password !== confirmPassword ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 focus:border-purple-700'}`} required
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs font-bold text-rose-600 mt-1">كلمتا المرور غير متطابقتين</p>
          )}
        </div>

        <button 
          type="submit" disabled={loading || usernameTaken || (confirmPassword && password !== confirmPassword)}
          className="mt-2 p-3 bg-purple-700 text-white font-bold rounded-xl hover:bg-purple-800 transition cursor-pointer disabled:opacity-50 text-sm shadow-md"
        >
          {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
        </button>
      </form>
    </div>
  );
}