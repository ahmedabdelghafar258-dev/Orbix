import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';

export default function Wallet({ onBack }) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('vodafone'); // vodafone, etisalat, orange, we, instapay, visa
  const [phoneNumber, setPhoneNumber] = useState('');

  // جلب رصيد المحفظة الحالي للمستخدم
  useEffect(() => {
    const fetchWallet = async () => {
      if (!auth.currentUser) return;
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setWalletBalance(userSnap.data().walletBalance || 0);
        }
      } catch (error) {
        console.error("Error fetching wallet:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  // دالة شحن المحفظة
  const handleTopUp = async (e) => {
    e.preventDefault();
    const amount = parseFloat(amountToAdd);
    if (!amount || amount <= 0) {
      alert("الرجاء إدخال مبلغ صحيح لشحن المحفظة.");
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, "users", auth.currentUser.uid);
      
      // تحديث الرصيد في فايربيز
      await updateDoc(userRef, {
        walletBalance: increment(amount)
      });

      setWalletBalance(prev => prev + amount);
      setAmountToAdd('');
      setPhoneNumber('');
      alert(`تم شحن محفظتك بمبلغ ${amount} جنيه بنجاح!`);
    } catch (error) {
      console.error("Error topping up wallet:", error);
      alert("حدث خطأ أثناء عملية الشحن.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 font-cairo bg-cover bg-center bg-no-repeat overflow-hidden page-transition" 
      style={{ backgroundImage: `url(${bgWaves})` }} 
      dir="rtl"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-xl w-full max-h-[90vh] p-8 shadow-2xl border border-slate-100 flex flex-col relative overflow-y-auto">
        
        {/* زر العودة للصفحة الرئيسية */}
        <div className="flex justify-start mb-2">
          <button 
            type="button" 
            onClick={onBack}
            className="text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <span>←</span>
            <span>العودة للصفحة الرئيسية</span>
          </button>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">محفظة Orbix</h2>
          <p className="text-xs text-slate-500">إدارة رصيدك وشحن المحفظة عبر وسائل الدفع المختلفة</p>
        </div>

        {/* عرض الرصيد الحالي */}
        <div className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-6 rounded-2xl shadow-md mb-6 flex items-center justify-between">
          <div>
            <span className="text-purple-200 text-xs block font-medium">رصيد محفظتك الحالي</span>
            <h3 className="text-3xl font-extrabold mt-1">{walletBalance} <span className="text-sm font-normal">جنيه</span></h3>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
            💳
          </div>
        </div>

        {/* نموذج شحن المحفظة */}
        <form onSubmit={handleTopUp} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-200 pb-2">شحن رصيد المحفظة</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-700">المبلغ المراد إضافته (بالجنيه)</label>
            <input 
              type="number" 
              value={amountToAdd}
              onChange={(e) => setAmountToAdd(e.target.value)}
              placeholder="مثال: 200"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-700">اختر طريقة الدفع / التحويل</label>
            <select 
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
            >
              <option value="vodafone">فودافون كاش (Vodafone Cash)</option>
              <option value="etisalat">اتصالات كاش (Etisalat Cash)</option>
              <option value="orange">أورانج كاش (Orange Cash)</option>
              <option value="we">وي كاش (WE Pay)</option>
              <option value="instapay">إنستا باي (InstaPay)</option>
              <option value="visa">بطاقة بنكية / فيزا (Visa / MasterCard)</option>
            </select>
          </div>

          {selectedMethod !== 'visa' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-700">رقم المحفظة المحول منها</label>
              <input 
                type="text" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md mt-1"
          >
            {loading ? 'جاري المعالجة...' : 'إتمام شحن المحفظة'}
          </button>
        </form>

      </div>
    </div>
  );
}