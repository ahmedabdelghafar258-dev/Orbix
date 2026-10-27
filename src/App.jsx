import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from './firebase';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ClientDashboard from './pages/ClientDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard'; // استيراد لوحة تحكم الفني

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(() => {
    try {
      const savedStep = localStorage.getItem('orbix_current_step');
      if (['home', 'signin', 'register'].includes(savedStep)) {
        return savedStep;
      }
    } catch (error) {
      console.error('Error reading saved page:', error);
    }
    return 'home';
  });

  const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false);
  const [policyModalType, setPolicyModalType] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('orbix_current_step', step);
    } catch (error) {
      console.error('Error saving current page:', error);
    }
  }, [step]);

  // مراقبة حالة المصادقة وجلب بيانات المستخدم من Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center font-cairo page-transition" dir="rtl">
        <p className="text-sm font-bold text-slate-600 animate-pulse">جاري تحميل المنصة...</p>
      </div>
    );
  }

  return (
    <div key={currentUser ? (userData?.userCategory || 'dashboard') : step} className="page-transition min-h-screen w-screen overflow-x-hidden">
      {currentUser ? (
        // التوجيه بناءً على فئة المستخدم (عميل أم فني/مـزود خدمة)
        userData?.userCategory === 'client' ? (
          <ClientDashboard userData={userData} />
        ) : (
          <TechnicianDashboard userData={userData} />
        )
      ) : (
        <>
          {step === 'home' && (
            <Home
              setStep={setStep}
              isHomeMenuOpen={isHomeMenuOpen}
              setIsHomeMenuOpen={setIsHomeMenuOpen}
              setPolicyModalType={setPolicyModalType}
            />
          )}

          {step === 'signin' && (
            <SignIn
              onSwitchToSignUp={() => setStep('register')}
              onBack={() => setStep('home')}
            />
          )}

          {step === 'register' && (
            <SignUp
              onSwitchToSignIn={() => setStep('signin')}
              onBack={() => setStep('home')}
            />
          )}
        </>
      )}
    </div>
  );
}