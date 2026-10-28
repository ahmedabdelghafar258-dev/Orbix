import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDocs, getDoc, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';

// قاعدة بيانات شاملة ومحدثة لكل قرى ومراكز مصر مع التصحيح الدقيق لـ "هوارة عدلان"
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

  const [governorate, setGovernorate] = useState('-');
  const [cityOrCenter, setCityOrCenter] = useState('-');
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

  // الأكشن الحقيقي والفعلي لتسجيل الدخول باستخدام جوجل
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const baseUsername = user.email ? user.email.split('@')[0].toLowerCase() : `user_${user.uid.substring(0, 6)}`;
        
        await setDoc(userDocRef, {
          uid: user.uid,
          userCategory: 'client',
          userSubtype: 'individual',
          fullName: user.displayName || 'مستخدم جوجل',
          companyName: '',
          username: baseUsername,
          phone: user.phoneNumber || '',
          email: user.email || '',
          profileimage: user.photoURL || '',
          specialization: '',
          createdAt: new Date(),
          address: {
            governorate: 'الفيوم',
            cityOrCenter: 'مركز الفيوم',
            villageOrDistrict: 'حي شرق مدينة الفيوم',
            streetDetails: 'غير محدد'
          }
        });
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setErrorMsg('حدث خطأ أثناء التسجيل باستخدام جوجل: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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

    if (userCategory === 'client') {
      if (governorate === '-' || cityOrCenter === '-' || !streetDetails.trim()) {
        setErrorMsg('يرجى اختيار المحافظة والمركز، وكتابة تفاصيل الشارع بدقة.');
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
          cityOrCenter,
          villageOrDistrict: villageOrDistrict !== '-' ? villageOrDistrict : 'غير محدد',
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

  // --- شاشة اختيار نوع العميل (الشركات / الأفراد) مع زر جوجل ---
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
          <h2 className="text-3xl font-extrabold text-slate-900 mb-6 tracking-tight">
            حسابات <span className="text-purple-700">العملاء</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
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

          {/* زر تسجيل الدخول باستخدام جوجل هنا */}
          <div className="w-full max-w-md mx-auto">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold">أو</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 shadow-xs transition cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{loading ? 'جاري فتح نافذة جوجل...' : 'سجل باستخدام جوجل'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- شاشة اختيار نوع مزود الخدمة (الشركات / الفنيين) مع زر جوجل ---
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
          <h2 className="text-3xl font-extrabold text-slate-900 mb-6 tracking-tight">
            حسابات <span className="text-purple-700">مزودي الخدمة</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
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

          {/* زر تسجيل الدخول باستخدام جوجل هنا أيضاً */}
          <div className="w-full max-w-md mx-auto">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold">أو</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 shadow-xs transition cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{loading ? 'جاري فتح نافذة جوجل...' : 'سجل باستخدام جوجل'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        {...{ fullName, setFullName, username, setUsername, phone, setPhone, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, specialization, setSpecialization, errorMsg, loading, usernameTaken, governorate, setGovernorate, cityOrCenter, setCityOrCenter, villageOrDistrict, setVillageOrDistrict, streetDetails, setStreetDetails, EGYPT_GOVERNORATES_DATA }}
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
        {...{ fullName, setFullName, companyName, setCompanyName, username, setUsername, phone, setPhone, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, specialization, setSpecialization, errorMsg, loading, usernameTaken, governorate, setGovernorate, cityOrCenter, setCityOrCenter, villageOrDistrict, setVillageOrDistrict, streetDetails, setStreetDetails, EGYPT_GOVERNORATES_DATA }}
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

function RegisterForm({ 
  title, isImageRequired, isEmailRequired, showCompanyName, showSpecialization, showAddress, specializationOptions,
  onSubmit, onBack, bgImage, fullName, setFullName, companyName, setCompanyName, 
  username, setUsername, phone, setPhone, email, setEmail, 
  password, setPassword, confirmPassword, setConfirmPassword, 
  specialization, setSpecialization, errorMsg, loading, usernameTaken, attemptedSubmit,
  governorate, setGovernorate, cityOrCenter, setCityOrCenter, villageOrDistrict, setVillageOrDistrict, streetDetails, setStreetDetails, EGYPT_GOVERNORATES_DATA 
}) {
  const isSpecInvalid = showSpecialization && attemptedSubmit && specialization === '-';
  const isGovInvalid = showAddress && attemptedSubmit && governorate === '-';
  const isCityInvalid = showAddress && attemptedSubmit && cityOrCenter === '-';
  const isStreetInvalid = showAddress && attemptedSubmit && !streetDetails.trim();

  const availableCenters = governorate !== '-' ? Object.keys(EGYPT_GOVERNORATES_DATA[governorate] || {}) : [];
  const availableVillages = (governorate !== '-' && cityOrCenter !== '-') ? EGYPT_GOVERNORATES_DATA[governorate][cityOrCenter] || [] : [];

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

        {showAddress && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">المحافظة <span className="text-rose-500">*</span></label>
              <select 
                value={governorate} 
                onChange={(e) => {
                  setGovernorate(e.target.value);
                  setCityOrCenter('-');
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

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">المركز أو المدينة <span className="text-rose-500">*</span></label>
              <select 
                value={cityOrCenter} 
                onChange={(e) => {
                  setCityOrCenter(e.target.value);
                  setVillageOrDistrict('-');
                }}
                disabled={governorate === '-'}
                className={`p-2.5 border rounded-xl text-sm outline-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed ${isCityInvalid ? 'border-rose-500 bg-rose-50 text-rose-600 font-bold' : 'border-slate-300 focus:border-purple-700'}`}
                required
              >
                <option value="-" disabled>-- اختر المركز أو المدينة --</option>
                {availableCenters.map((center) => (
                  <option key={center} value={center} className="text-slate-900">{center}</option>
                ))}
              </select>
              {isCityInvalid && <p className="text-xs font-bold text-rose-600 mt-1">يجب اختيار المركز أو المدينة</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">القرية أو الحي <span className="text-slate-400">(اختياري)</span></label>
              <select 
                value={villageOrDistrict} 
                onChange={(e) => setVillageOrDistrict(e.target.value)}
                disabled={cityOrCenter === '-'}
                className="p-2.5 border rounded-xl text-sm outline-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed focus:border-purple-700"
              >
                <option value="-">-- اختر القرية أو الحي (اختياري) --</option>
                {availableVillages.map((village) => (
                  <option key={village} value={village} className="text-slate-900">{village}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">اسم الشارع ورقم البيت / العقار <span className="text-rose-500">*</span></label>
              <input 
                type="text" placeholder="مثال: شارع الجمهورية، عمارة 14، الدور الثالث" value={streetDetails} onChange={(e) => setStreetDetails(e.target.value)}
                className={`p-2.5 border rounded-xl text-sm outline-none bg-white ${isStreetInvalid ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 focus:border-purple-700'}`} required
              />
              {isStreetInvalid && <p className="text-xs font-bold text-rose-600 mt-1">اسم الشارع ورقم البيت إجباري</p>}
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