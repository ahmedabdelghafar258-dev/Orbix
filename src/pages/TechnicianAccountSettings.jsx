import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';

export default function TechnicianAccountSettings({ userData, onBack, onUpdateUserData }) {
  const [fullName, setFullName] = useState(userData?.fullName || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [profileImage, setProfileImage] = useState(userData?.profileimage || userData?.profileImage || '');
  
  // حقول كلمات المرور
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // تخصص الفني الثابت
  const techSpecialization = userData?.serviceCategory || userData?.specialization || userData?.category || 'غير محدد';

  // دالة لحساب ما إذا مر 6 شهور (180 يوماً) على آخر تعديل
  const canModifyField = (lastChangeTimestamp) => {
    if (!lastChangeTimestamp) return true; // لو لم يتم التعديل من قبل، مسموح
    const lastDate = lastChangeTimestamp.toDate ? lastChangeTimestamp.toDate() : new Date(lastChangeTimestamp);
    const now = new Date();
    const diffTime = Math.abs(now - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 180; // 180 يوماً = 6 شهور
  };

  // معالجة اختيار الصورة من الجهاز
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ text: 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميجابايت.', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      setSubmitting(true);
      setMessage(null);

      const updates = {};
      let nameChanged = fullName !== (userData?.fullName || '');
      let phoneChanged = phone !== (userData?.phone || '');

      // 1. التحقق من قاعدة الـ 6 شهور للاسم
      if (nameChanged) {
        if (!canModifyField(userData?.lastFullNameChange)) {
          setMessage({ text: 'عفواً، لا يمكن تغيير الاسم إلا مرة كل ستة أشهر.', type: 'error' });
          setSubmitting(false);
          return;
        }
        updates.fullName = fullName;
        updates.lastFullNameChange = serverTimestamp();
      }

      // 2. التحقق من قاعدة الـ 6 شهور لرقم الهاتف
      if (phoneChanged) {
        if (!canModifyField(userData?.lastPhoneChange)) {
          setMessage({ text: 'عفواً، لا يمكن تغيير رقم التليفون إلا مرة كل ستة أشهر.', type: 'error' });
          setSubmitting(false);
          return;
        }
        updates.phone = phone;
        updates.lastPhoneChange = serverTimestamp();
      }

      // تحديث الصورة الشخصية دائماً متاح
      updates.profileImage = profileImage;
      updates.profileimage = profileImage;

      // 3. التحقق وتغيير كلمة المرور لو تم إدخالها
      if (newPassword.trim().length > 0) {
        if (!oldPassword) {
          setMessage({ text: 'يرجى إدخال كلمة المرور القديمة لتغيير كلمة المرور.', type: 'error' });
          setSubmitting(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setMessage({ text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.', type: 'error' });
          setSubmitting(false);
          return;
        }
        if (newPassword.length < 6) {
          setMessage({ text: 'يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف.', type: 'error' });
          setSubmitting(false);
          return;
        }

        const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
      }

      // 4. تنفيذ التحديثات في فايربيز Firestore
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, updates);

      // تمرير البيانات المحدثة للداشبورد
      if (onUpdateUserData) {
        onUpdateUserData({ ...userData, ...updates });
      }

      setMessage({ text: 'تم تحديث إعدادات الحساب بنجاح!', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Error updating technician account:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setMessage({ text: 'كلمة المرور القديمة غير صحيحة.', type: 'error' });
      } else {
        setMessage({ text: 'حدث خطأ أثناء التحديث، حاول مرة أخرى.', type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex flex-col font-cairo bg-cover bg-center bg-no-repeat overflow-hidden" 
      style={{ backgroundImage: `url(${bgWaves})` }} 
      dir="rtl"
    >
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">إعدادات حساب الفني</h1>
          <span className="text-xs text-slate-500">تعديل البيانات الشخصية والاطلاع على التخصص المعتمد</span>
        </div>
        <button 
          type="button" 
          onClick={onBack}
          className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
        >
          <span>←</span>
          <span>العودة للصفحة الرئيسية</span>
        </button>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col gap-5 overflow-y-auto">
        
        {message && (
          <div className={`p-4 rounded-2xl text-xs font-bold shadow-md ${
            message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdateAccount} className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-8 shadow-xl flex flex-col gap-5">
          
          {/* رفع الصورة الشخصية من الجهاز */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 overflow-hidden border-2 border-indigo-200 flex items-center justify-center shrink-0 shadow-inner">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-extrabold text-indigo-700">{fullName?.charAt(0) || '👤'}</span>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">الصورة الشخصية</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-600 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>
          </div>

          {/* تخصص العمل (للاطلاع فقط وغير قابل للتعديل) */}
          <div className="flex flex-col gap-1.5 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
            <label className="text-xs font-bold text-indigo-900 flex items-center justify-between">
              <span>تخصص العمل المعتمد (ثابت)</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-extrabold">للاطلاع فقط</span>
            </label>
            <input 
              type="text" 
              value={techSpecialization}
              disabled
              className="w-full bg-indigo-100/60 border border-indigo-200 rounded-xl px-4 py-3 text-xs text-indigo-950 font-extrabold cursor-not-allowed select-none"
            />
            <span className="text-[10px] text-slate-500 mt-0.5">التخصص مسجل رسمياً في ملفك ولا يمكن تغييره من إعدادات الحساب.</span>
          </div>

          {/* الاسم الكامل (محدد بـ 6 شهور بلون أحمر) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>الاسم الكامل</span>
              <span className="text-[10px] text-rose-600 font-extrabold">يمكن تغييره مرة كل ستة أشهر</span>
            </label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="اكتب اسمك الكامل..."
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* رقم الهاتف (محدد بـ 6 شهور بلون أحمر) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>رقم الهاتف</span>
              <span className="text-[10px] text-rose-600 font-extrabold">يمكن تغييره مرة كل ستة أشهر</span>
            </label>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* تغيير كلمة المرور */}
          <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-extrabold text-slate-900">تغيير كلمة المرور</h4>
            
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600">كلمة المرور القديمة</label>
              <input 
                type="password" 
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600">كلمة المرور الجديدة</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-600">تأكيد كلمة المرور الجديدة</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور الجديدة للتأكيد"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md disabled:opacity-50"
          >
            {submitting ? 'جاري الحفظ...' : 'حفظ التعديلات ✓'}
          </button>

        </form>

      </main>
    </div>
  );
}