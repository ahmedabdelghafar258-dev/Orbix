import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import emailjs from '@emailjs/browser';

// مفاتيح EmailJS لـ Orbix
const EMAILJS_SERVICE_ID = 'orbix_email_service';
const EMAILJS_TEMPLATE_ID = 'template_lukfm65';
const EMAILJS_PUBLIC_KEY = '8WP1f4i1pEbTOth8_';

/**
 * توليد كود عشوائي من 6 أرقام وإرساله للإيميل الحقيقي عبر EmailJS
 */
export const sendEmailVerificationCode = async (userId, userEmail) => {
  try {
    // 1. توليد كود مكون من 6 أرقام
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 2. حساب وقت انتهاء الصلاحية (مثلاً بعد 10 دقائق)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 3. تخزين الكود في جدول email_verifications في الفايرستور
    await setDoc(doc(db, "email_verifications", userId), {
      code: verificationCode,
      expiresAt: expiresAt,
      createdAt: new Date()
    });

    // 4. إرسال الإيميل فعلياً عبر EmailJS باستخدام القالب الخاص بك
    const templateParams = {
      to_email: userEmail,
      verification_code: verificationCode,
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log("تم إرسال الإيميل بنجاح إلى:", userEmail);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("فشل إرسال بريد التحقق، تأكد من اتصال الإنترنت أو صحة البريد.");
  }
};

/**
 * التحقق من صحة الكود المدخل وتحديث حالة الحساب
 */
export const verifyEmailCode = async (userId, enteredCode) => {
  try {
    const verifDocRef = doc(db, "email_verifications", userId);
    const verifDocSnap = await getDoc(verifDocRef);

    if (!verifDocSnap.exists()) {
      throw new Error("لم يتم العثور على كود تحقق لهذا الحساب، يرجى إعادة الإرسال.");
    }

    const data = verifDocSnap.data();
    
    // التحقق من الصلاحية والوقت
    if (data.code !== enteredCode.trim()) {
      throw new Error("كود التحقق غير صحيح!");
    }

    if (new Date() > data.expiresAt.toDate()) {
      throw new Error("لقد انتهت صلاحية الكود، يرجى طلب كود جديد.");
    }

    // تحديث حالة المستخدم في جدول users ليصبح الإيميل موثقاً
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      emailVerified: true
    });

    return true;
  } catch (error) {
    console.error("Verification Error:", error);
    throw error;
  }
};

/**
 * تسجيل الدخول والتوجيه حسب الدور (الكود الخاص بك)
 */
export const loginAndRedirect = async (email, password, navigate) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const role = userData.role || userData.userCategory; // دعم الدور أو الفئة

      if (role === 'provider' || role === 'service_provider') {
        navigate('/provider-dashboard');
      } else {
        navigate('/client-dashboard');
      }
    } else {
      navigate('/home');
    }
  } catch (error) {
    console.error("Login Error:", error.message);
    throw error;
  }
};