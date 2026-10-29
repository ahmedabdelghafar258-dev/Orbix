import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import emailjs from '@emailjs/browser';

// =====================================================
// إعدادات EmailJS الخاصة بمنصة Orbix (مطابقة للصورة الحالية)
// =====================================================
const EMAILJS_SERVICE_ID = 'Orbix'; // الخدمة بالاسم الظاهر في لوحة التحكم بدقة
const EMAILJS_TEMPLATE_ID = 'template_lukfm65';
const EMAILJS_PUBLIC_KEY = '8WP1f4i1pEbTOth8_';

// =====================================================
// إرسال كود التحقق إلى البريد الإلكتروني
// =====================================================
export const sendEmailVerificationCode = async (userId, userEmail) => {
  if (!userId || !userEmail) {
    throw new Error('معرّف المستخدم والبريد الإلكتروني مطلوبان.');
  }

  const trimmedEmail = userEmail.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new Error('يرجى إدخال بريد إلكتروني صحيح.');
  }

  const verificationCode = String(
    Math.floor(100000 + Math.random() * 900000)
  );

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const verificationRef = doc(db, 'email_verifications', userId);

  try {
    // إرسال الرسالة عبر EmailJS بالمعرّف الصحيح
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: trimmedEmail,
        verification_code: verificationCode
      },
      {
        publicKey: EMAILJS_PUBLIC_KEY
      }
    );

    // حفظ الكود في الفايرستور بعد نجاح الإرسال
    await setDoc(verificationRef, {
      code: verificationCode,
      email: trimmedEmail,
      expiresAt,
      createdAt: new Date()
    });

    console.log('تم إرسال كود التحقق بنجاح.');
    return true;
  } catch (error) {
    console.error('Email verification sending error:', error);

    try {
      await deleteDoc(verificationRef);
    } catch (deleteError) {
      console.error('Could not clean verification document:', deleteError);
    }

    const details =
      error?.text ||
      error?.message ||
      'خطأ غير معروف';
    
    throw new Error(
      `فشل إرسال بريد التحقق عبر EmailJS تأكد من صحة البريد أو إعدادات الخدمة: ${details}`
    );
  }
};

// =====================================================
// التحقق من الكود وتأكيد البريد الإلكتروني
// =====================================================
export const verifyEmailCode = async (userId, enteredCode) => {
  if (!userId || !enteredCode) {
    throw new Error('يرجى إدخال كود التحقق.');
  }

  const code = String(enteredCode).trim();
  const verificationRef = doc(db, 'email_verifications', userId);
  const verificationSnapshot = await getDoc(verificationRef);

  if (!verificationSnapshot.exists()) {
    throw new Error(
      'لم يتم العثور على كود التحقق. يرجى طلب إرسال كود جديد.'
    );
  }

  const verificationData = verificationSnapshot.data();

  if (code !== String(verificationData.code)) {
    throw new Error('كود التحقق غير صحيح.');
  }

  const expiry = verificationData.expiresAt;
  const expiresAt =
    expiry && typeof expiry.toDate === 'function'
      ? expiry.toDate()
      : new Date(expiry);

  if (
    Number.isNaN(expiresAt.getTime()) ||
    Date.now() > expiresAt.getTime()
  ) {
    throw new Error(
      'انتهت صلاحية كود التحقق. يرجى طلب كود جديد.'
    );
  }

  const userDocRef = doc(db, 'users', userId);
  const userSnapshot = await getDoc(userDocRef);

  if (!userSnapshot.exists()) {
    throw new Error('لم يتم العثور على حساب المستخدم.');
  }

  const userData = userSnapshot.data();

  if (
    verificationData.email &&
    verificationData.email.toLowerCase() !==
    String(userData.email || '').trim().toLowerCase()
  ) {
    throw new Error(
      'البريد المرتبط بكود التحقق لا يطابق البريد المسجل بالحساب.'
    );
  }

  await updateDoc(userDocRef, {
    emailVerified: true
  });

  try {
    await deleteDoc(verificationRef);
  } catch (error) {
    console.error('Could not delete used verification code:', error);
  }

  return true;
};

// =====================================================
// تسجيل الدخول ومنع الحسابات غير الموثقة
// =====================================================
export const loginAndRedirect = async (email, password, navigate) => {
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
      throw new Error(
        'بيانات الحساب غير مكتملة. يرجى التواصل مع الدعم.'
      );
    }

    const userData = userSnapshot.data();

    if (userData.emailVerified !== true) {
      await signOut(auth);
      throw new Error(
        'يجب تأكيد بريدك الإلكتروني أولًا قبل تسجيل الدخول. افتح صفحة التسجيل وأكمل التحقق من بريدك.'
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
    throw new Error(
      error.code === 'auth/invalid-credential'
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
        : error.message || 'حدث خطأ أثناء تسجيل الدخول.'
    );
  }
};