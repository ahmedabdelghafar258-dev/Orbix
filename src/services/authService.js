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
// إرسال كود التحقق إلى البريد الإلكتروني للعميل
// =====================================================
export const sendEmailVerificationCode = async (
  userId,
  userEmail
) => {
  if (!userId || !userEmail?.trim()) {
    throw new Error('معرّف المستخدم والبريد الإلكتروني مطلوبان.');
  }

  if (
    !EMAILJS_SERVICE_ID ||
    !EMAILJS_TEMPLATE_ID ||
    !EMAILJS_PUBLIC_KEY
  ) {
    throw new Error(
      'إعدادات EmailJS غير مكتملة. راجع Service ID وTemplate ID وPublic Key.'
    );
  }

  const trimmedEmail = userEmail.trim().toLowerCase();

  // إنشاء كود من 6 أرقام.
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
    // حفظ الكود ووقت انتهاء صلاحيته أولاً.
    await setDoc(verificationRef, {
      code: verificationCode,
      email: trimmedEmail,
      expiresAt,
      createdAt: new Date(),
    });

    // إرسال البريد عبر EmailJS باستخدام المعلمات المتوافقة مع القالب الافتراضي
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: trimmedEmail,
        to_name: trimmedEmail.split('@')[0],
        message: verificationCode,
        verification_code: verificationCode,
      },
      {
        publicKey: EMAILJS_PUBLIC_KEY,
      }
    );

    console.log('تم إرسال كود التحقق بنجاح إلى:', trimmedEmail);

    return true;
  } catch (error) {
    console.error('EmailJS / Verification Error:', error);

    // حذف الكود إذا فشل الإرسال، حتى لا يبقى كود غير مُرسل.
    try {
      await deleteDoc(verificationRef);
    } catch (deleteError) {
      console.error(
        'Could not delete unused verification code:',
        deleteError
      );
    }

    const errorDetails = error?.text || error?.message || 'خطأ غير معروف';
    throw new Error(
      `فشل إرسال بريد التحقق عبر EmailJS تأكد من صحة البريد أو إعدادات الخدمة: ${errorDetails}`
    );
  }
};

// =====================================================
// التحقق من الكود وتحديث حالة الحساب
// =====================================================
export const verifyEmailCode = async (
  userId,
  enteredCode
) => {
  if (!userId || !enteredCode?.trim()) {
    throw new Error('يرجى إدخال كود التحقق.');
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

    // التأكد من تطابق الكود.
    if (
      String(verificationData.code) !== enteredCode.trim()
    ) {
      throw new Error('كود التحقق غير صحيح.');
    }

    // التأكد من وجود تاريخ انتهاء صالح.
    const expiryValue = verificationData.expiresAt;

    const expiryDate =
      expiryValue &&
      typeof expiryValue.toDate === 'function'
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
      throw new Error(
        'لم يتم العثور على بيانات الحساب.'
      );
    }

    const userData = userSnapshot.data();

    // منع استخدام كود مرسل إلى بريد مختلف.
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

    // تحديث حالة التحقق في Firestore.
    await updateDoc(userDocRef, {
      emailVerified: true,
    });

    // حذف الكود بعد نجاح التحقق.
    try {
      await deleteDoc(verificationRef);
    } catch (error) {
      console.error(
        'Could not delete used verification code:',
        error
      );
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

      throw new Error(
        'بيانات الحساب غير مكتملة. يرجى التواصل مع الدعم.'
      );
    }

    const userData = userSnapshot.data();

    // لا يُسمح بالدخول إلا بعد التحقق من البريد.
    if (userData.emailVerified !== true) {
      await signOut(auth);

      throw new Error(
        'يجب تأكيد بريدك الإلكتروني أولًا قبل تسجيل الدخول. افتح صفحة التسجيل وأكمل التحقق من بريدك.'
      );
    }

    // دعم أسماء الأدوار المستخدمة في المشروع.
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
      error.message?.includes(
        'يجب تأكيد بريدك الإلكتروني'
      ) ||
      error.message?.includes(
        'بيانات الحساب غير مكتملة'
      )
    ) {
      throw error;
    }

    if (error.code === 'auth/invalid-credential') {
      throw new Error(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
      );
    }

    if (error.code === 'auth/user-not-found') {
      throw new Error('هذا الحساب غير موجود.');
    }

    if (error.code === 'auth/too-many-requests') {
      throw new Error(
        'تم إجراء محاولات كثيرة. يرجى المحاولة لاحقًا.'
      );
    }

    throw new Error(
      error.message || 'حدث خطأ أثناء تسجيل الدخول.'
    );
  }
};