import React, { useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// نفس قاعدة بيانات محافظات ومراكز وقرى مصر المعتمدة
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

export default function AccountSettings({ userData, onBack, onUpdateUserData }) {
  const [fullName, setFullName] = useState(userData?.fullName || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [profileImage, setProfileImage] = useState(userData?.profileimage || userData?.profileImage || '');
  
  // حقول العنوان
  const [governorate, setGovernorate] = useState(userData?.address?.governorate || '-');
  const [cityOrCenter, setCityOrCenter] = useState(userData?.address?.cityOrCenter || '-');
  const [villageOrDistrict, setVillageOrDistrict] = useState(userData?.address?.villageOrDistrict || '-');
  const [streetDetails, setStreetDetails] = useState(userData?.address?.streetDetails || '');

  // حقول كلمة السر الجديدة
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState({ show: false, message: '' });

  // دالة اختيار وضغط الصورة
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setProfileImage(compressedDataUrl);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = () => {
    setProfileImage('');
  };

  // دالة حفظ التعديلات وتحديث البيانات لتسمع في التطبيق وفي NewOrder فوراً
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (userData?.userCategory === 'client') {
      if (governorate === '-' || cityOrCenter === '-' || !streetDetails.trim()) {
        alert("يرجى اختيار المحافظة والمركز وكتابة تفاصيل الشارع بدقة.");
        return;
      }
    }

    try {
      setLoading(true);
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.exists() ? userSnap.data() : {};

      const now = Date.now();
      const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;

      if (fullName !== data.fullName && data.lastProfileUpdate) {
        if (now - data.lastProfileUpdate < sixMonths) {
          alert("عذراً، لا يمكنك تغيير الاسم إلا مرة واحدة كل 6 أشهر.");
          setLoading(false);
          return;
        }
      }

      let changedFields = [];
      if (fullName !== data.fullName) changedFields.push('الاسم الكامل');
      if (phone !== data.phone) changedFields.push('رقم التليفون');
      
      const oldImage = data.profileimage || data.profileImage || '';
      if (profileImage !== oldImage) {
        if (profileImage === '') {
          changedFields.push('حذف صورة الملف الشخصي');
        } else {
          changedFields.push('صورة الملف الشخصي');
        }
      }

      if (userData?.userCategory === 'client') {
        const oldAddr = data.address || {};
        if (governorate !== oldAddr.governorate || cityOrCenter !== oldAddr.cityOrCenter || villageOrDistrict !== oldAddr.villageOrDistrict || streetDetails !== oldAddr.streetDetails) {
          changedFields.push('عنوان السكن');
        }
      }

      await updateProfile(auth.currentUser, {
        displayName: fullName
      });

      const updatedAddress = userData?.userCategory === 'client' ? {
        governorate,
        cityOrCenter,
        villageOrDistrict: villageOrDistrict !== '-' ? villageOrDistrict : 'غير محدد',
        streetDetails: streetDetails.trim()
      } : (userData?.address || {});

      const updateData = {
        fullName: fullName,
        phone: phone,
        profileimage: profileImage,
        lastProfileUpdate: now
      };

      if (userData?.userCategory === 'client') {
        updateData.address = updatedAddress;
      }

      await updateDoc(userRef, updateData);

      // تجهيز كائن البيانات المحدث بالكامل لتمريره فوراً
      const newUserDataFull = {
        ...userData,
        fullName,
        phone,
        profileimage: profileImage,
        address: updatedAddress
      };

      // 1. التحديث الفوري للـ LocalStorage لضمان قراءته في NewOrder فوراً
      try {
        localStorage.setItem('cachedUserData', JSON.stringify(newUserDataFull));
      } catch (err) {
        console.error("Local storage error:", err);
      }

      // 2. تمرير التحديثات الفورية للـ App State الرئيسية
      if (typeof onUpdateUserData === 'function') {
        onUpdateUserData(newUserDataFull);
      }

      let messageText = "تم تحديث البيانات بنجاح!";
      if (changedFields.length > 0) {
        messageText = `تم تحديث (${changedFields.join('، ')}) بنجاح!`;
      }

      setSuccessModal({ show: true, message: messageText });
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("حدث خطأ أثناء تحديث البيانات: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة السر الجديدة غير متطابقة!');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('كلمة السر يجب ألا تقل عن 6 أحرف.');
      return;
    }

    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      await updatePassword(auth.currentUser, newPassword);
      setSuccessModal({ show: true, message: "تم تحديث (كلمة المرور) بنجاح!" });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordError('كلمة السر الحالية غير صحيحة أو حدث خطأ.');
    } finally {
      setLoading(false);
    }
  };

  const availableCenters = governorate !== '-' ? Object.keys(EGYPT_GOVERNORATES_DATA[governorate] || {}) : [];
  const availableVillages = (governorate !== '-' && cityOrCenter !== '-') ? EGYPT_GOVERNORATES_DATA[governorate][cityOrCenter] || [] : [];

  return (
    <div className="min-h-screen w-full bg-slate-50 font-cairo flex flex-col relative" dir="rtl">
      
      {successModal.show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
              ✨
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">تم بنجاح!</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {successModal.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessModal({ show: false, message: '' })}
              className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md mt-2"
            >
              موافق
            </button>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <h1 className="text-lg font-extrabold text-slate-900">إعدادات الحساب</h1>
        <button 
          type="button" 
          onClick={onBack}
          className="text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
        >
          <span>←</span>
          <span>العودة للصفحة الرئيسية</span>
        </button>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col gap-6 my-4">
        
        <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">الملف الشخصي والبيانات الأساسية</h3>
          
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-purple-100 overflow-hidden border-2 border-purple-200 flex items-center justify-center shrink-0">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-purple-700">{fullName.charAt(0) || '👤'}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">صورة الملف الشخصي</label>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer inline-flex items-center gap-2 border border-purple-200">
                  <span>📁</span>
                  <span>اختر صورة</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>

                {profileImage && (
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer inline-flex items-center gap-2 border border-rose-200"
                  >
                    <span>🗑️</span>
                    <span>حذف الصورة</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">الاسم الكامل <span className="text-[10px] font-normal text-amber-600">(لا يتغير إلا مرة كل 6 أشهر)</span></label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">رقم التليفون</label>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
              required
            />
          </div>

          {/* تعديل العنوان للعملاء */}
          {userData?.userCategory === 'client' && (
            <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
              <h4 className="text-xs font-extrabold text-slate-900">عنوان السكن الأساسي</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">المحافظة <span className="text-rose-500">*</span></label>
                <select 
                  value={governorate}
                  onChange={(e) => {
                    setGovernorate(e.target.value);
                    setCityOrCenter('-');
                    setVillageOrDistrict('-');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                  required
                >
                  <option value="-" disabled>-- اختر المحافظة --</option>
                  {Object.keys(EGYPT_GOVERNORATES_DATA).map((gov) => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">المركز أو المدينة <span className="text-rose-500">*</span></label>
                <select 
                  value={cityOrCenter}
                  onChange={(e) => {
                    setCityOrCenter(e.target.value);
                    setVillageOrDistrict('-');
                  }}
                  disabled={governorate === '-'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="-" disabled>-- اختر المركز أو المدينة --</option>
                  {availableCenters.map((center) => (
                    <option key={center} value={center}>{center}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">القرية أو الحي <span className="text-slate-400">(اختياري)</span></label>
                <select 
                  value={villageOrDistrict}
                  onChange={(e) => setVillageOrDistrict(e.target.value)}
                  disabled={cityOrCenter === '-'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="-">-- اختر القرية أو الحي (اختياري) --</option>
                  {availableVillages.map((village) => (
                    <option key={village} value={village}>{village}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">اسم الشارع ورقم البيت / العقار <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={streetDetails}
                  onChange={(e) => setStreetDetails(e.target.value)}
                  placeholder="مثال: شارع الجمهورية، عمارة 14، الدور الثالث"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md mt-2"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ التعديلات الشخصية'}
          </button>
        </form>

        <form onSubmit={handleUpdatePassword} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">تغيير كلمة السر</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">كلمة السر الحالية</label>
            <input 
              type="password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">كلمة السر الجديدة</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">تأكيد كلمة السر الجديدة</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
              required
            />
          </div>

          {passwordError && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 text-center">
              {passwordError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md mt-2"
          >
            {loading ? 'جاري التحديث...' : 'تحديث كلمة السر'}
          </button>
        </form>

      </main>
    </div>
  );
}