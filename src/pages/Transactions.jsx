import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';

export default function Transactions({ onBack }) {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب المعاملات والطلبات المغلقة والمكتملة الخاصة بالعميل فقط
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!auth.currentUser) return;
      try {
        setLoading(true);
        const clientId = auth.currentUser.uid;

        const q = query(
          collection(db, "orders"),
          where("clientId", "==", clientId)
        );
        
        const querySnapshot = await getDocs(q);
        const allOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // تصفية المعاملات التي تم إغلاقها أو اكتمالها فقط
        const closedOrders = allOrders.filter(order => order.status === 'completed' || order.closedByClient === true);
        
        setCompletedOrders(closedOrders);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex flex-col font-cairo bg-cover bg-center bg-no-repeat overflow-hidden" 
      style={{ backgroundImage: `url(${bgWaves})` }} 
      dir="rtl"
    >
      {/* شريط علوي مع زر العودة الموحد */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">سجل المعاملات</h1>
          <span className="text-xs text-slate-500">عرض العمليات والخدمات المكتملة التي تمت بنجاح</span>
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

      {/* محتوى الصفحة */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-4 overflow-y-auto">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs font-bold">
            جاري تحميل سجل المعاملات...
          </div>
        ) : completedOrders.length === 0 ? (
          <div className="text-center py-20 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 flex flex-col items-center gap-3 shadow-lg">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl">📄</div>
            <h3 className="text-base font-extrabold text-slate-900">لا توجد معاملات مكتملة حتى الآن</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              الخدمات والطلبات التي تقوم بإغلاقها ستظهر هنا كمرجع لسجل معاملاتك.
            </p>
          </div>
        ) : (
          completedOrders.map((order) => {
            const basePrice = order.totalOrderAmount || order.fixedPrice || order.agreedPrice || 200;

            return (
              <div 
                key={order.id} 
                className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-sm shrink-0">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{order.serviceCategory} - {order.title || 'طلب خدمة'}</h4>
                      <p className="text-[11px] text-slate-400">معاملة مكتملة ومغلقة بنجاح</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    {basePrice} ج.م (شامل العمولة)
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex flex-col sm:flex-row justify-between gap-2 pt-1">
                  <p><span className="font-bold text-slate-800">الفني المنفذ:</span> {order.acceptedTechnicianName || 'فني معتمد'}</p>
                  <p><span className="font-bold text-slate-800">وصف الطلب:</span> {order.description || 'لا توجد تفاصيل إضافية'}</p>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}