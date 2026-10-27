import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';

export default function SignIn({ onSwitchToSignUp, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email || !password) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    try {
      setLoading(true);
      // 1. تسجيل الدخول عبر Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. التحقق من وجود المستخدم وجلب بياناته من Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User data retrieved:", userData);
      } else {
        console.warn("User document not found in Firestore!");
      }

      localStorage.removeItem('orbix_current_step');
    } catch (error) {
      console.error("Error signing in:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setErrorMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else {
        setErrorMessage('حدث خطأ أثناء تسجيل الدخول. تأكد من اتصالك بالإنترنت.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative min-h-screen w-screen flex flex-col items-center justify-center p-4 font-cairo bg-cover bg-center bg-no-repeat overflow-x-hidden page-transition" 
      style={{ backgroundImage: `url(${bgWaves})` }} 
      dir="rtl"
    >
      
      {/* زر الرجوع */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          type="button" 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-purple-700 bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <span>←</span> الرجوع للخلف
        </button>
      </div>

      <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100">
        
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">تسجيل الدخول</h2>
          <p className="text-xs text-slate-500">أهلاً بك مجدداً في منصة Orbix</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl font-bold text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">البريد الإلكتروني</label>
            <input 
              type="email" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 border border-slate-300 rounded-xl text-xs outline-none bg-white focus:border-purple-700 transition"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 border border-slate-300 rounded-xl text-xs outline-none bg-white focus:border-purple-700 transition"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            ليس لديك حساب بعد؟{' '}
            <button 
              type="button"
              onClick={onSwitchToSignUp}
              className="text-purple-700 font-bold hover:underline cursor-pointer"
            >
              انضم إلينا الآن
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}