import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

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