import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';

export default function TechnicianWallet({ userData, onBack }) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = async () => {
    if (!auth.currentUser) return;
    try {
      setLoading(true);
      const techId = auth.currentUser.uid;

      // 1. جلب رصيد المحفظة الحالي من بروفايل الفني
      const userDocRef = doc(db, "users", techId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setWalletBalance(data.walletBalance || 0);
      }

      // 2. جلب الطلبات المكتملة الخاصة بالفني لعرض سجل الأرباح
      const q = query(
        collection(db, "orders"),
        where("acceptedTechnicianId", "==", techId),
        where("status", "==", "completed")
      );
      
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCompletedOrders(orders);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [userData]);

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex flex-col font-cairo bg-cover bg-center bg-no-repeat overflow-hidden" 
      style={{ backgroundImage: `url(${bgWaves})` }} 
      dir="rtl"
    >
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">محفظة الأرباح</h1>
          <span className="text-xs text-slate-500">إدارة رصيدك المالي وسجل الأرباح الصافية للعمليات المكتملة</span>
        </div>
        <button 
          type="button" 
          onClick={onBack}
          className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
        >
          <span>↑</span>
          <span>العودة للصفحة الرئيسية</span>
        </button>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-6 overflow-y-auto">
        
        {/* كارد الرصيد الإجمالي */}
        <div className="bg-gradient-to-br from-indigo-700 to-purple-800 text-white rounded-3xl p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-center sm:text-right">
            <span className="text-xs text-indigo-200 font-medium">إجمالي الرصيد الصافي المتاح بالمحفظة</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {walletBalance.toFixed(2)} <span className="text-lg font-bold">ج.م</span>
            </h2>
            <p className="text-[11px] text-indigo-100 mt-1">الرصيد جاهز تماماً للسحب أو التحويل لحسابك الشخصي.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center">
            <span className="block text-xl font-extrabold text-emerald-300">صافي الأرباح</span>
            <span className="text-[10px] text-indigo-100 font-medium">مُضاف مباشرة بعد إغلاق الطلبات</span>
          </div>
        </div>

        {/* سجل العمليات والأرباح */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col gap-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">سجل العمليات المكتملة</h3>

          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs font-bold">
              جاري تحميل سجل المحفظة...
            </div>
          ) : completedOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              لا توجد عمليات مكتملة حتى الآن. ستظهر أرباح العمليات هنا بمجرد إغلاقها من تتبع الطلب.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {completedOrders.map((order) => {
                const total = order.totalOrderAmount || order.fixedPrice || 200;
                // استخدام الصافي المحفوظ مسبقاً أو حسابه في حال الطلبات القديمة
                const earnings = order.technicianEarnings || (total * 0.975);

                return (
                  <div 
                    key={order.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-inner"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-extrabold shrink-0">
                        💰
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900">
                          {order.title || order.serviceCategory || 'خدمة صيانة'}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          العميل: <span className="font-bold text-slate-700">{order.clientName || 'عميل Orbix'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-left w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                      <div className="text-right sm:text-left">
                        <span className="text-[10px] text-slate-400 block">إجمالي قيمة الخدمة: {total} ج.م</span>
                        <span className="text-xs font-extrabold text-emerald-600 block mt-0.5">
                          المبلغ المضاف: +{earnings.toFixed(2)} ج.م
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}