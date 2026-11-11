import {
  createUserWithEmailAndPassword,
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

// =====================================================
// إرسال كود التحقق (مباشرة عبر النظام المحلي للـ Firestore)
// =====================================================
export const sendEmailVerificationCode = async (
  userId,
  userEmail
) => {
  if (!userId || !userEmail?.trim()) {
    throw new Error('معرّف المستخدم والبريد الإلكتروني مطلوبان.');
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
    // حفظ الكود ووقت انتهاء صلاحيته في Firestore.
    await setDoc(verificationRef, {
      code: verificationCode,
      email: trimmedEmail,
      expiresAt,
      createdAt: new Date(),
    });

    // طباعة الكود في الـ Console للتجربة الفورية والسهلة بدون تعقيد
    console.log('========================================');
    console.log(`[Orbix Verification] كود التحقق لـ ${trimmedEmail} هو: ${verificationCode}`);
    console.log('========================================');

    return true;
  } catch (error) {
    console.error('Verification Code Generation Error:', error);

    throw new Error(
      `فشل إنشاء كود التحقق. حاول مرة أخرى. ${error?.message || ''}`
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