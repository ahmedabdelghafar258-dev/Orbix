import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

import { auth, db } from '../firebase';
import emailjs from '@emailjs/browser';

// =====================================================
// إعدادات EmailJS الخاصة بمشروع Orbix
// =====================================================
const EMAILJS_SERVICE_ID = 'Orbix';
const EMAILJS_TEMPLATE_ID = 'template_lukfm65';
const EMAILJS_PUBLIC_KEY = '8WP1f4i1pEbTOth8_';

// =====================================================
// إرسال كود التحقق مباشرة إلى إيميل العميل المدخل
// =====================================================
export const sendEmailVerificationCode = async (
  userId,
  userEmail
) => {
  if (!userId || !userEmail?.trim()) {
    throw new Error('معرّف المستخدم والبريد الإلكتروني مطلوبان.');
  }

  const trimmedEmail = userEmail.trim().toLowerCase();

  // إنشاء كود من 6 أرقام عشوائي.
  const verificationCode = String(
    Math.floor(100000 + Math.random() * 900000)
  );

  // صلاحية الكود 10 دقائق.
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const verificationRef = doc(
    db,
    'email_verifications',
    userId
  );

  try {
    // 1. حفظ الكود ووقت انتهاء صلاحيته في Firestore أولاً.
    await setDoc(verificationRef, {
      code: verificationCode,
      email: trimmedEmail,
      expiresAt,
      createdAt: new Date(),
    });

    // 2. إرسال الكود للبريد الإلكتروني الذي كتبه العميل حصرياً عبر EmailJS
    const emailParams = {
      to_email: trimmedEmail,          // البريد الإلكتروني للعميل الذي سيستقبل الرسالة
      to_name: trimmedName(trimmedEmail), // اسم المستخدم المشتق من الإيميل
      verification_code: verificationCode, // كود التحقق المكون من 6 أرقام
      message: verificationCode,       // احتياطي لمحتوى القالب
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      emailParams,
      {
        publicKey: EMAILJS_PUBLIC_KEY,
      }
    );

    console.log('تم إرسال كود التحقق بنجاح إلى البريد:', trimmedEmail);

    return true;
  } catch (error) {
    console.error('EmailJS Send Error:', error);

    // حذف المستند من الفايربيز لو فشل الإرسال حتى لا يتثبت كود معلق
    try {
      await deleteDoc(verificationRef);
    } catch (deleteError) {
      console.error('Could not cleanup verification doc:', deleteError);
    }

    const errorMsg = error?.text || error?.message || 'خطأ غير معروف في الاتصال';
    throw new Error(
      `فشل إرسال بريد التحقق إلى بريدك. تأكد من صحة الإيميل أو الاتصال: ${errorMsg}`
    );
  }
};

// دالة مساعدة لاشتقاق الاسم من البريد
function trimmedName(email) {
  return email.split('@')[0] || 'User';
}

// =====================================================
// التحقق من الكود المدخل وتفعيل الحساب
// =====================================================
export const verifyEmailCode = async (
  userId,
  enteredCode
) => {
  if (!userId || !enteredCode?.trim()) {
    throw new Error('يرجى إدخال كود التحقق المكون من 6 أرقام.');
  }

  const verificationRef = doc(
    db,
    'email_verifications',
    userId
  );

  const userDocRef = doc(db, 'users', userId);

  try {
    const verificationSnapshot = await getDoc(verificationRef);

    if (!verificationSnapshot.exists()) {
      throw new Error(
        'لم يتم العثور على كود التحقق. يرجى طلب كود جديد.'
      );
    }

    const verificationData = verificationSnapshot.data();

    // التأكد من تطابق الكود المدخل
    if (
      String(verificationData.code) !== enteredCode.trim()
    ) {
      throw new Error('كود التحقق غير صحيح. تأكد من الأرقام المرسلة.');
    }

    // التحقق من صلاحية الوقت (10 دقائق)
    const expiryValue = verificationData.expiresAt;
    const expiryDate =
      expiryValue && typeof expiryValue.toDate === 'function'
        ? expiryValue.toDate()
        : expiryValue instanceof Date
          ? expiryValue
          : new Date(expiryValue);

    if (
      Number.isNaN(expiryDate.getTime()) ||
      Date.now() > expiryDate.getTime()
    ) {
      throw new Error(
        'انتهت صلاحية كود التحقق. يرجى طلب كود جديد.'
      );
    }

    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) {
      throw new Error('لم يتم العثور على بيانات الحساب.');
    }

    const userData = userSnapshot.data();

    // التحقق من مطابقة البريد الإلكتروني
    if (
      verificationData.email &&
      userData.email &&
      verificationData.email.toLowerCase() !==
        userData.email.trim().toLowerCase()
    ) {
      throw new Error(
        'البريد الإلكتروني لا يطابق البريد المسجل بالحساب.'
      );
    }

    // تحديث حالة الحساب وتفعيله في Firestore
    await updateDoc(userDocRef, {
      emailVerified: true,
    });

    // حذف السجل بعد النجاح
    try {
      await deleteDoc(verificationRef);
    } catch (err) {
      console.error('Error cleaning up verification doc:', err);
    }

    return true;
  } catch (error) {
    console.error('Verification Error:', error);
    throw error;
  }
};

// =====================================================
// تسجيل الدخول ومنع الحسابات غير الموثقة
// =====================================================
export const loginAndRedirect = async (
  email,
  password,
  navigate
) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const user = userCredential.user;
    const userDocRef = doc(db, 'users', user.uid);
    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) {
      await signOut(auth);
      throw new Error('بيانات الحساب غير مكتملة. يرجى التواصل مع الدعم.');
    }

    const userData = userSnapshot.data();

    // منع الدخول إذا لم يتم توثيق البريد
    if (userData.emailVerified !== true) {
      await signOut(auth);
      throw new Error(
        'يجب تأكيد بريدك الإلكتروني أولًا برمز التحقق قبل تسجيل الدخول.'
      );
    }

    const role = userData.role || userData.userCategory;

    if (
      role === 'provider' ||
      role === 'service_provider'
    ) {
      navigate('/provider-dashboard');
    } else {
      navigate('/client-dashboard');
    }

    return userData;
  } catch (error) {
    console.error('Login Error:', error);

    if (
      error.message?.includes('يجب تأكيد بريدك الإلكتروني') ||
      error.message?.includes('بيانات الحساب غير مكتملة')
    ) {
      throw error;
    }

    if (error.code === 'auth/invalid-credential') {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }

    if (error.code === 'auth/user-not-found') {
      throw new Error('هذا الحساب غير موجود.');
    }

    if (error.code === 'auth/too-many-requests') {
      throw new Error('تم إجراء محاولات كثيرة. يرجى المحاولة لاحقًا.');
    }

    throw new Error(error.message || 'حدث خطأ أثناء تسجيل الدخول.');
  }
};