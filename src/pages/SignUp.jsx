import React, { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

import {
  doc,
  setDoc,
  getDocs,
  getDoc,
  collection,
  query,
  where
} from 'firebase/firestore';

import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';
import {
  sendEmailVerificationCode,
  verifyEmailCode
} from '../services/authService';

const EGYPT_GOVERNORATES_DATA = {
  "الفيوم": {
    "مركز الفيوم": [
      "حي شرق مدينة الفيوم", "حي غرب مدينة الفيوم", "المنشية",
      "دار الرماد", "حفناوي", "قرية دمو", "قرية العامرية",
      "قرية اللاهون", "قرية دمشقين", "قرية هوارة المقطع",
      "قرية هوارة عدلان", "قرية سيلا", "قرية دلاتون",
      "قرية منشأة لطف الله", "قرية كفر فلوكس", "قرية دملاش",
      "قرية الحامولي", "قرية زاوية الكرادسة", "قرية بني صالح",
      "قرية كفور النيل", "قرية قحافة", "قرية الشيخ فضل",
      "قرية العدوة", "قرية تلات", "قرية العزب", "قرية دهمشة",
      "قرية منشأة عبد الله", "قرية كفور حفناوي", "قرية فانوس",
      "قرية معصرة صاوي", "قرية سنهريس", "قرية كفرى المرابعين",
      "عزبة حبيب", "عزبة جاد الله"
    ],
    "مركز إطسا": [
      "مدينة إطسا", "قرية مطول", "قرية قصر الباسل",
      "قرية منية الحيط", "قرية دفنو", "قرية تطون",
      "قرية أبو جندير", "قرية قلمشاة", "قرية الغرق قبلي",
      "قرية الغرق بحري", "قرية قصر الجبالي", "قرية جردو",
      "قرية بحر أبو المير", "قرية معصرة صاوي", "قرية إهريت"
    ],
    "مركز سنورس": [
      "مدينة سنورس", "قرية جرفاس", "قرية سنهور القبلية",
      "قرية سنهور البحرية", "قرية بهمش", "قرية ترسا",
      "قرية نقالطة", "قرية بيت الله", "قرية مطرطارس القبلية",
      "قرية مطرطارس البحرية", "قرية السعيدية", "قرية فيدكيم",
      "قرية منشأة بنى عتمان", "قرية أبو عيطة"
    ],
    "مركز أبشواي": [
      "مدينة أبشواي", "قرية النصارية", "قرية طداو",
      "قرية أبو غرارة", "قرية العجميين", "قرية سنرو القبلية",
      "قرية سنرو البحرية", "قرية الخالدية", "قرية شكشوك",
      "قرية أبو كساه"
    ],
    "مركز طامية": [
      "مدينة طامية", "قرية الروضة", "قرية دار السلام",
      "قرية فانوس", "قرية السراني", "قرية قصر رشوان",
      "قرية المظاطلي", "قرية منشأة الجمال", "قرية كفر محفوظ",
      "قرية الروبيات"
    ],
    "مركز يوسف الصديق": [
      "مدينة يوسف الصديق", "قرية النصر", "قرية قارون",
      "قرية الشواشنة", "قرية المشرك القبلي", "قرية المشرك البحري",
      "قرية الحامولي", "قرية الريان", "قرية غرقانة",
      "قرية الصبيحي"
    ],
    "الفيوم الجديدة": [
      "حي الحي الأول", "حي الحي الثاني", "حي الاستثماري",
      "منطقة الإسكان الاجتماعي", "منطقة المطورين"
    ]
  },
  "القاهرة": {
    "مدينة نصر": [
      "حي الألف مسكن", "حي رابعة العدوية", "حي الـ 8 عمارات",
      "حي السفارات", "عزبة الهجانة", "الحي السابع", "الحي العاشر"
    ],
    "التجمع الخامس": [
      "الدبلوماسيين", "النرجس", "البنفسج",
      "المستثمرين الجنوبية", "المستثمرين الشمالية", "القطامية"
    ],
    "المعادي": [
      "معادي ثكنات", "معادي السرايات", "المعادي الجديدة",
      "طريق صقر قريش", "دار السلام"
    ],
    "مصر الجديدة": [
      "سلطان باشا", "الميرغني", "كوربة", "وهدان", "النزهة"
    ],
    "الدقي": [
      "شارع مصدق", "شارع السودان",
      "شارع البطل أحمد عبد العزيز", "محي الدين أبو العز"
    ],
    "المقطم": [
      "الهضبة الوسطى", "الهضبة العليا", "المقطم القديم", "التونسي"
    ]
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

export default function SignUp({
  onSwitchToSignIn,
  onBack,
  onLoginSuccess
}) {
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

  const [registeredUserId, setRegisteredUserId] = useState(null);
  const [registeredUserEmail, setRegisteredUserEmail] = useState('');
  const [companyVerificationCode, setCompanyVerificationCode] = useState('');

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);

  useEffect(() => {
    let active = true;

    const checkUsername = async () => {
      const trimmed = username.trim().toLowerCase();

      if (!trimmed) {
        if (active) setUsernameTaken(false);
        return;
      }

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', trimmed));
        const snapshot = await getDocs(q);

        if (active) {
          setUsernameTaken(!snapshot.empty);
        }
      } catch (error) {
        console.error('Username check error:', error);
      }
    };

    const timer = setTimeout(checkUsername, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username]);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user) {
        throw new Error('لم يتم استرجاع بيانات المستخدم من جوجل.');
      }

      if (!user.email || !user.emailVerified) {
        await signOut(auth);
        throw new Error('يجب استخدام حساب Google ببريد إلكتروني موثق.');
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userData;

      if (!userDocSnap.exists()) {
        const baseUsername = user.email.split('@')[0].toLowerCase();

        const usersRef = collection(db, 'users');
        const usernameQuery = query(
          usersRef,
          where('username', '==', baseUsername)
        );
        const usernameSnapshot = await getDocs(usernameQuery);

        const safeUsername = usernameSnapshot.empty
          ? baseUsername
          : `${baseUsername}_${user.uid.substring(0, 6)}`;

        userData = {
          uid: user.uid,
          userCategory: 'client',
          userSubtype: 'individual',
          fullName: user.displayName || 'مستخدم جوجل',
          companyName: '',
          username: safeUsername,
          phone: user.phoneNumber || '',
          email: user.email,
          profileimage: user.photoURL || '',
          specialization: '',
          emailVerified: true,
          createdAt: new Date(),
          address: {
            governorate: 'الفيوم',
            cityOrCenter: 'مركز الفيوم',
            villageOrDistrict: 'حي شرق مدينة الفيوم',
            streetDetails: 'غير محدد'
          }
        };

        await setDoc(userDocRef, userData);
      } else {
        userData = userDocSnap.data();

        if (userData.emailVerified !== true) {
          await signOut(auth);
          throw new Error(
            'هذا الحساب لم يتم توثيق بريده الإلكتروني. يرجى إكمال التحقق أولًا.'
          );
        }
      }

      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(userData);
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      setErrorMsg(
        'تعذر التسجيل باستخدام Google: ' +
        (error.message || 'خطأ غير معروف')
      );
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

    if (password.length < 6) {
      setErrorMsg('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
      return;
    }

    if (usernameTaken) {
      setErrorMsg('اسم المستخدم مستخدم من قبل، يرجى اختيار اسم آخر.');
      return;
    }

    if (
      (userSubtype === 'tech' || userSubtype === 'provider_company') &&
      specialization === '-'
    ) {
      setErrorMsg('يرجى اختيار التخصص المناسب قبل إتمام التسجيل.');
      return;
    }

    const trimmedEmail = email ? email.trim().toLowerCase() : '';

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح لتلقي كود التحقق.');
      return;
    }

    if (!fullName.trim() || !username.trim() || !phone.trim()) {
      setErrorMsg('يرجى استكمال الاسم واسم المستخدم ورقم الهاتف.');
      return;
    }

    if (userCategory === 'client') {
      if (
        governorate === '-' ||
        cityOrCenter === '-' ||
        !streetDetails.trim()
      ) {
        setErrorMsg(
          'يرجى اختيار المحافظة والمدينة وكتابة تفاصيل الشارع بدقة.'
        );
        return;
      }
    }

    if (
      (userSubtype === 'client_company' ||
        userSubtype === 'provider_company') &&
      !companyName.trim()
    ) {
      setErrorMsg('يرجى كتابة اسم الشركة.');
      return;
    }

    setLoading(true);

    let createdUser = null;

    try {
      const trimmedUsername = username.trim().toLowerCase();

      const usersRef = collection(db, 'users');
      const usernameQuery = query(
        usersRef,
        where('username', '==', trimmedUsername)
      );

      const usernameSnapshot = await getDocs(usernameQuery);

      if (!usernameSnapshot.empty) {
        setUsernameTaken(true);
        setErrorMsg('اسم المستخدم مستخدم بالفعل.');
        setLoading(false);
        return;
      }

      // 1. إنشاء حساب Firebase أولاً
      const credential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );

      createdUser = credential.user;

      const userData = {
        uid: createdUser.uid,
        userCategory,
        userSubtype,
        fullName: fullName.trim(),
        companyName: companyName.trim(),
        username: trimmedUsername,
        phone: phone.trim(),
        email: trimmedEmail,
        specialization: specialization !== '-' ? specialization : '',
        emailVerified: false,
        createdAt: new Date()
      };

      if (userCategory === 'client') {
        userData.address = {
          governorate,
          cityOrCenter,
          villageOrDistrict:
            villageOrDistrict !== '-'
              ? villageOrDistrict
              : 'غير محدد',
          streetDetails: streetDetails.trim()
        };
      }

      await setDoc(doc(db, 'users', createdUser.uid), userData);

      // 2. إرسال كود التحقق عبر EmailJS
      await sendEmailVerificationCode(
        createdUser.uid,
        trimmedEmail
      );

      setRegisteredUserId(createdUser.uid);
      setRegisteredUserEmail(trimmedEmail);
      setCompanyVerificationCode('');

      // إنهاء جلسة Firebase المؤقتة حتى يتم التحقق
      await signOut(auth);

      // التحويل المباشر لخطوة إدخال الكود
      setStep('verify-email');
    } catch (error) {
      console.error('Registration & Email Error:', error);

      if (createdUser && auth.currentUser?.uid === createdUser.uid) {
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error('Sign out error:', signOutError);
        }
      }

      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('هذا البريد الإلكتروني مسجل بالفعل.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg('كلمة المرور ضعيفة. استخدم كلمة مرور أقوى.');
      } else {
        setErrorMsg(
          'فشل إرسال بريد التحقق: ' +
          (error.message || 'خطأ غير معروف')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCompanySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!registeredUserId || !registeredUserEmail) {
      setErrorMsg('بيانات التسجيل غير متاحة. يرجى بدء التسجيل من جديد.');
      return;
    }

    if (!companyVerificationCode.trim()) {
      setErrorMsg('يرجى إدخال كود التحقق المرسل إلى بريدك.');
      return;
    }

    setLoading(true);

    try {
      // 1. التحقق من الكود
      await verifyEmailCode(
        registeredUserId,
        companyVerificationCode.trim()
      );

      // 2. جلب بيانات المستخدم بعد التوثيق
      const userDocRef = doc(db, 'users', registeredUserId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error('لم يتم العثور على بيانات الحساب.');
      }

      const userData = userDocSnap.data();

      if (userData.emailVerified !== true) {
        throw new Error(
          'تم فحص الكود، لكن حالة التحقق لم تُحدّث في قاعدة البيانات.'
        );
      }

      // 3. تسجيل الدخول أوتوماتيكياً بكلمة المرور التي أدخلها المستخدم أثناء التسجيل
      const credential = await signInWithEmailAndPassword(
        auth,
        registeredUserEmail,
        password
      );

      if (credential.user.uid !== registeredUserId) {
        await signOut(auth);
        throw new Error('الحساب الذي سجل دخوله لا يطابق الحساب المتحقق منه.');
      }

      if (typeof onLoginSuccess !== 'function') {
        await signOut(auth);
        throw new Error('تعذر فتح الحساب بعد التحقق.');
      }

      // 4. الدخول للحساب والتوجه للوحة التحكم
      onLoginSuccess(userData);
    } catch (error) {
      console.error('Email Verification Error:', error);
      setErrorMsg(
        error.message || 'كود التحقق غير صحيح أو انتهت صلاحيته.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!registeredUserId || !registeredUserEmail) {
      setErrorMsg('بيانات التسجيل غير متاحة.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      await sendEmailVerificationCode(
        registeredUserId,
        registeredUserEmail
      );

      alert('تم إعادة إرسال كود التحقق بنجاح.');
    } catch (error) {
      setErrorMsg(
        'فشل إعادة إرسال الكود: ' +
        (error.message || 'خطأ غير معروف')
      );
    } finally {
      setLoading(false);
    }
  };

  // التوجيه التلقائي لصفحة إدخال الكود
  if (step === 'verify-email') {
    return (
      <VerifyCompanyEmail
        companyVerificationCode={companyVerificationCode}
        setCompanyVerificationCode={setCompanyVerificationCode}
        handleVerifyCompanySubmit={handleVerifyCompanySubmit}
        setStep={() => {
          setErrorMsg('');
          setStep('main');
        }}
        loading={loading}
        errorMsg={errorMsg}
        onResendCode={handleResendCode}
      />
    );
  }

  if (step === 'main') {
    return (
      <div
        className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 font-cairo bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: `url(${bgWaves})` }}
        dir="rtl"
      >
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
          <p className="text-sm text-slate-600 mb-8 font-medium">
            اختر طبيعة حسابك لنبدأ رحلتك معنا
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border-2 border-slate-100 hover:border-purple-600 shadow-lg flex flex-col justify-between text-center transition-all duration-300">
              <div>
                <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto shadow-inner">
                  🏢
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">التسجيل كعميل</h3>
                <p className="text-xs text-slate-500 mb-6">
                  اطلب خدمات الصيانة لمنشأتك أو وحدتك بكل سهولة
                </p>
              </div>
              <button
                onClick={() => {
                  setStep('client_type');
                  setAttemptedSubmit(false);
                  setSpecialization('-');
                }}
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
                <p className="text-xs text-slate-500 mb-6">
                  قدم خدمات الصيانة واستقبل طلبات العملاء المتاحة
                </p>
              </div>
              <button
                onClick={() => {
                  setStep('provider_type');
                  setAttemptedSubmit(false);
                  setSpecialization('-');
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl cursor-pointer transition shadow-md"
              >
                اختر مزود الخدمة
              </button>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-slate-200/60">
            <p className="text-xs text-slate-600 font-medium">
              لديك حساب بالفعل؟{' '}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-purple-700 font-bold hover:underline cursor-pointer"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'client_type') {
    return (
      <ChoicePage
        title="حسابات العملاء"
        onBack={() => setStep('main')}
        options={[
          {
            icon: '🏢',
            title: 'الشركات والكيانات',
            description: 'للبنايات والمؤسسات الكبرى وإدارة المرافق',
            button: 'متابعة للشركات',
            dark: true,
            onClick: () => setStep('client_company')
          },
          {
            icon: '👤',
            title: 'الأفراد والمنشآت الصغيرة',
            description: 'للمنازل والوحدات الفردية وطلب الصيانة المباشرة',
            button: 'متابعة للأفراد',
            onClick: () => setStep('client_individual')
          }
        ]}
      />
    );
  }

  if (step === 'provider_type') {
    return (
      <ChoicePage
        title="حسابات مزودي الخدمة"
        onBack={() => setStep('main')}
        options={[
          {
            icon: '🏢',
            title: 'التسجيل لشركات الصيانة',
            description: 'قدم خدمات الكيانات وشارك في إدارة العقود الكبرى',
            button: 'متابعة لشركات الصيانة',
            dark: true,
            onClick: () => setStep('provider_company')
          },
          {
            icon: '🛠️',
            title: 'التسجيل للفنيين',
            description: 'استقبل الطلبات الفردية وقم بتنفيذ أعمال الصيانة',
            button: 'متابعة للفنيين',
            onClick: () => setStep('provider_tech')
          }
        ]}
      />
    );
  }

  const commonProps = {
    fullName, setFullName,
    username, setUsername,
    phone, setPhone,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    specialization, setSpecialization,
    errorMsg, loading, usernameTaken,
    attemptedSubmit,
    bgImage: bgWaves,
    onGoogleSignIn: handleGoogleSignIn
  };

  if (step === 'client_individual') {
    return (
      <RegisterForm
        {...commonProps}
        title="حساب الأفراد والمنشآت الصغيرة"
        showCompanyName={false}
        showSpecialization={false}
        showAddress={true}
        isImageRequired={false}
        isEmailRequired={true}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitRegistration('client', 'individual');
        }}
        onBack={() => setStep('client_type')}
        governorate={governorate}
        setGovernorate={setGovernorate}
        cityOrCenter={cityOrCenter}
        setCityOrCenter={setCityOrCenter}
        villageOrDistrict={villageOrDistrict}
        setVillageOrDistrict={setVillageOrDistrict}
        streetDetails={streetDetails}
        setStreetDetails={setStreetDetails}
      />
    );
  }

  if (step === 'client_company') {
    return (
      <RegisterForm
        {...commonProps}
        title="حساب الشركات والكيانات (عميل)"
        showCompanyName={true}
        showSpecialization={false}
        showAddress={true}
        isImageRequired={true}
        isEmailRequired={true}
        companyName={companyName}
        setCompanyName={setCompanyName}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitRegistration('client', 'client_company');
        }}
        onBack={() => setStep('client_type')}
        governorate={governorate}
        setGovernorate={setGovernorate}
        cityOrCenter={cityOrCenter}
        setCityOrCenter={setCityOrCenter}
        villageOrDistrict={villageOrDistrict}
        setVillageOrDistrict={setVillageOrDistrict}
        streetDetails={streetDetails}
        setStreetDetails={setStreetDetails}
      />
    );
  }

  if (step === 'provider_tech') {
    return (
      <RegisterForm
        {...commonProps}
        title="تسجيل الفنيين"
        showCompanyName={false}
        showSpecialization={true}
        showAddress={false}
        isImageRequired={true}
        isEmailRequired={true}
        specializationOptions={[
          { value: 'AC Maintenance', label: 'صيانة تكييف' },
          { value: 'Electricity', label: 'كهرباء' },
          { value: 'Plumbing', label: 'سباكة' },
          { value: 'IT', label: 'آي تي' }
        ]}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitRegistration('provider', 'tech');
        }}
        onBack={() => setStep('provider_type')}
      />
    );
  }

  if (step === 'provider_company') {
    return (
      <RegisterForm
        {...commonProps}
        title="تسجيل شركة صيانة"
        showCompanyName={true}
        showSpecialization={true}
        showAddress={false}
        isImageRequired={true}
        isEmailRequired={true}
        companyName={companyName}
        setCompanyName={setCompanyName}
        specializationOptions={[
          { value: 'Comprehensive', label: 'شركة شاملة' },
          { value: 'Electricity', label: 'كهرباء' },
          { value: 'Plumbing', label: 'سباكة' },
          { value: 'IT', label: 'آي تي' },
          { value: 'AC Maintenance', label: 'صيانة تكييفات' }
        ]}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitRegistration('provider', 'provider_company');
        }}
        onBack={() => setStep('provider_type')}
      />
    );
  }

  return null;
}

function ChoicePage({ title, onBack, options }) {
  return (
    <div
      className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 font-cairo bg-cover bg-center bg-no-repeat overflow-y-auto"
      style={{ backgroundImage: `url(${bgWaves})` }}
      dir="rtl"
    >
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
        <h2 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">
          {title.split(' ').slice(0, -1).join(' ')}{' '}
          <span className="text-purple-700">{title.split(' ').slice(-1)}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {options.map((option) => (
            <div
              key={option.title}
              className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border-2 border-slate-100 hover:border-purple-600 shadow-lg flex flex-col justify-between text-center transition-all duration-300"
            >
              <div>
                <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto shadow-inner">
                  {option.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {option.title}
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  {option.description}
                </p>
              </div>
              <button
                onClick={option.onClick}
                className={`w-full py-3 ${
                  option.dark
                    ? 'bg-slate-900 hover:bg-slate-800'
                    : 'bg-purple-700 hover:bg-purple-800'
                } text-white font-bold rounded-2xl cursor-pointer transition shadow-md`}
              >
                {option.button}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegisterForm({
  title,
  isImageRequired,
  isEmailRequired,
  showCompanyName,
  showSpecialization,
  showAddress,
  specializationOptions = [],
  onSubmit,
  onGoogleSignIn,
  onBack,
  bgImage,
  fullName,
  setFullName,
  companyName = '',
  setCompanyName = () => {},
  username,
  setUsername,
  phone,
  setPhone,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  specialization,
  setSpecialization,
  errorMsg,
  loading,
  usernameTaken,
  attemptedSubmit,
  governorate = '-',
  setGovernorate = () => {},
  cityOrCenter = '-',
  setCityOrCenter = () => {},
  villageOrDistrict = '-',
  setVillageOrDistrict = () => {},
  streetDetails = '',
  setStreetDetails = () => {}
}) {
  const isSpecInvalid =
    showSpecialization && attemptedSubmit && specialization === '-';

  const isGovInvalid =
    showAddress && attemptedSubmit && governorate === '-';

  const isCityInvalid =
    showAddress && attemptedSubmit && cityOrCenter === '-';

  const isStreetInvalid =
    showAddress && attemptedSubmit && !streetDetails.trim();

  const availableCenters =
    governorate !== '-' && EGYPT_GOVERNORATES_DATA[governorate]
      ? Object.keys(EGYPT_GOVERNORATES_DATA[governorate])
      : [];

  const availableVillages =
    governorate !== '-' &&
    cityOrCenter !== '-' &&
    EGYPT_GOVERNORATES_DATA[governorate]?.[cityOrCenter]
      ? EGYPT_GOVERNORATES_DATA[governorate][cityOrCenter]
      : [];

  return (
    <div
      className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 font-cairo bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
      dir="rtl"
    >
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-purple-700 bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <span>←</span> الرجوع للخلف
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="relative z-10 flex flex-col gap-3 w-full max-w-md max-h-[85vh] p-6 shadow-2xl rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md overflow-y-auto"
      >
        <h2 className="text-xl font-extrabold text-center text-slate-900 mb-1">
          {title}
        </h2>
        <p className="text-xs text-center text-slate-500 mb-2">
          أدخل البيانات المطلوبة بدقة
        </p>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">
            صورة الحساب / الشعار{' '}
            {isImageRequired
              ? <span className="text-rose-500">(إجباري)</span>
              : <span className="text-slate-400">(اختياري)</span>}
          </label>
          <input
            type="file"
            accept="image/*"
            className="p-2 border border-slate-300 rounded-xl text-xs bg-slate-50 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700"
            required={isImageRequired}
          />
        </div>

        {showCompanyName && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">
              اسم الشركة
            </label>
            <input
              type="text"
              placeholder="اسم الشركة"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="p-2.5 border border-slate-300 rounded-xl text-sm focus:border-purple-700 outline-none bg-white"
              required
            />
          </div>
        )}

        {showSpecialization && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">
              التخصص <span className="text-rose-500">(إجباري)</span>
            </label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className={`p-2.5 border rounded-xl text-sm outline-none bg-white ${
                isSpecInvalid
                  ? 'border-rose-500 bg-rose-50/30 text-rose-600 font-bold'
                  : 'border-slate-300 focus:border-purple-700'
              }`}
              required
            >
              <option value="-" disabled>-- اختر التخصص --</option>
              {specializationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {isSpecInvalid && (
              <p className="text-xs font-bold text-rose-600 mt-1">
                يجب اختيار تخصص صحيح للمتابعة
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">الاسم الكامل</label>
          <input
            type="text"
            placeholder="الاسم الكامل"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="p-2.5 border border-slate-300 rounded-xl text-sm focus:border-purple-700 outline-none bg-white"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">اسم المستخدم</label>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`p-2.5 border rounded-xl text-sm outline-none bg-white ${
              usernameTaken
                ? 'border-rose-500 bg-rose-50/30'
                : 'border-slate-300 focus:border-purple-700'
            }`}
            required
          />
          {usernameTaken && (
            <p className="text-xs font-bold text-rose-600 mt-1">
              اسم المستخدم هذا مستخدم من قبل، غير متاح
            </p>
          )}
        </div>

        {showAddress && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                المحافظة <span className="text-rose-500">*</span>
              </label>
              <select
                value={governorate}
                onChange={(e) => {
                  setGovernorate(e.target.value);
                  setCityOrCenter('-');
                  setVillageOrDistrict('-');
                }}
                className={`p-2.5 border rounded-xl text-sm outline-none bg-white ${
                  isGovInvalid
                    ? 'border-rose-500 bg-rose-50 text-rose-600 font-bold'
                    : 'border-slate-300 focus:border-purple-700'
                }`}
                required
              >
                <option value="-" disabled>-- اختر المحافظة --</option>
                {Object.keys(EGYPT_GOVERNORATES_DATA).map((gov) => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
              {isGovInvalid && (
                <p className="text-xs font-bold text-rose-600 mt-1">
                  يجب اختيار المحافظة
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                المركز أو المدينة <span className="text-rose-500">*</span>
              </label>
              <select
                value={cityOrCenter}
                onChange={(e) => {
                  setCityOrCenter(e.target.value);
                  setVillageOrDistrict('-');
                }}
                disabled={governorate === '-'}
                className={`p-2.5 border rounded-xl text-sm outline-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed ${
                  isCityInvalid
                    ? 'border-rose-500 bg-rose-50 text-rose-600 font-bold'
                    : 'border-slate-300 focus:border-purple-700'
                }`}
                required
              >
                <option value="-" disabled>
                  -- اختر المركز أو المدينة --
                </option>
                {availableCenters.map((center) => (
                  <option key={center} value={center}>{center}</option>
                ))}
              </select>
              {isCityInvalid && (
                <p className="text-xs font-bold text-rose-600 mt-1">
                  يجب اختيار المركز أو المدينة
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                القرية أو الحي <span className="text-slate-400">(اختياري)</span>
              </label>
              <select
                value={villageOrDistrict}
                onChange={(e) => setVillageOrDistrict(e.target.value)}
                disabled={cityOrCenter === '-'}
                className="p-2.5 border rounded-xl text-sm outline-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed focus:border-purple-700"
              >
                <option value="-">-- اختر القرية أو الحي (اختياري) --</option>
                {availableVillages.map((village) => (
                  <option key={village} value={village}>{village}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                اسم الشارع ورقم البيت / العقار{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: شارع الجمهورية، عمارة 14، الدور الثالث"
                value={streetDetails}
                onChange={(e) => setStreetDetails(e.target.value)}
                className={`p-2.5 border rounded-xl text-sm outline-none bg-white ${
                  isStreetInvalid
                    ? 'border-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:border-purple-700'
                }`}
                required
              />
              {isStreetInvalid && (
                <p className="text-xs font-bold text-rose-600 mt-1">
                  اسم الشارع ورقم البيت إجباري
                </p>
              )}
            </div>
          </>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">رقم التليفون</label>
          <input
            type="tel"
            placeholder="01xxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="p-2.5 border border-slate-300 rounded-xl text-sm focus:border-purple-700 outline-none bg-white"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">
            البريد الإلكتروني{' '}
            <span className="text-rose-500">(إجباري لتلقي كود التحقق)</span>
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2.5 border border-slate-300 rounded-xl text-sm focus:border-purple-700 outline-none bg-white"
            required={isEmailRequired}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2.5 border border-slate-300 rounded-xl text-sm focus:border-purple-700 outline-none bg-white"
            minLength={6}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">
            تأكيد كلمة المرور
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`p-2.5 border rounded-xl text-sm outline-none bg-white ${
              confirmPassword && password !== confirmPassword
                ? 'border-rose-500 bg-rose-50/30'
                : 'border-slate-300 focus:border-purple-700'
            }`}
            minLength={6}
            required
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs font-bold text-rose-600 mt-1">
              كلمتا المرور غير متطابقتين
            </p>
          )}
        </div>

        <div className="mt-1">
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-bold">
              أو
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50 mt-1"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>
              {loading ? 'جاري فتح نافذة جوجل...' : 'سجل باستخدام جوجل'}
            </span>
          </button>
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            usernameTaken ||
            (confirmPassword && password !== confirmPassword)
          }
          className="mt-2 p-3 bg-purple-700 text-white font-bold rounded-xl hover:bg-purple-800 transition cursor-pointer disabled:opacity-50 text-sm shadow-md"
        >
          {loading
            ? 'جاري إنشاء الحساب وإرسال كود التحقق...'
            : 'إنشاء الحساب'}
        </button>
      </form>
    </div>
  );
}