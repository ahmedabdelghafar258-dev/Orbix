import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * 1. تسجيل الدخول وتوجيه المستخدم بناءً على دوره (Provider أو Client)
 */
export const loginAndRedirect = async (email, password, navigate) => {
  try {
    // تسجيل الدخول عبر فايربيس
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // جلب بيانات المستخدم من جدول users في الفايرستور لمعرفة دوره
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const role = userData.role;

      // التوجيه بناءً على الدور
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

/**
 * 2. توليد وإرسال كود التحقق من البريد الإلكتروني (6 أرقام)
 */
export async function sendEmailVerificationCode(userId, userEmail) {
  try {
    // توليد كود عشوائي مكون من 6 أرقام
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // حفظ الكود في قاعدة البيانات مع وقت انتهاء الصلاحية (بعد 10 دقائق)
    const codeRef = doc(db, "email_verifications", userId);
    await setDoc(codeRef, {
      code: verificationCode,
      email: userEmail,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 دقائق
    });

    // هنا يتم إرسال الكود عبر خدمة الإيميلات أو طباعته للاختبار
    console.log(`تم إرسال كود التحقق (${verificationCode}) إلى الإيميل: ${userEmail}`);
    
    return verificationCode;
  } catch (error) {
    console.error("Error sending verification code:", error);
    throw new Error("فشل إرسال كود التحقق.");
  }
}

/**
 * 3. التحقق من كود الإيميل وتحديث حالة التفعيل في قاعدة البيانات
 */
export async function verifyEmailCode(userId, enteredCode) {
  try {
    const codeRef = doc(db, "email_verifications", userId);
    const codeSnap = await getDoc(codeRef);

    if (!codeSnap.exists()) {
      throw new Error("لم يتم العثور على طلب تحقق، اطلب كود جديد.");
    }

    const data = codeSnap.data();
    
    if (data.code !== enteredCode) {
      throw new Error("كود التحقق غير صحيح.");
    }

    // تحديث حالة المستخدم في جدول users أنه تم تفعيل إيميله بنجاح
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      emailVerified: true
    });

    return true;
  } catch (error) {
    console.error("Verification Error:", error.message);
    throw error;
  }
}