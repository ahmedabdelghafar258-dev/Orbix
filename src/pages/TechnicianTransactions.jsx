import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';

export default function TechnicianTransactions({ onBack }) {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب الطلبات والمعاملات المكتملة والمغلقة الخاصة بالفني الحالي فقط
  useEffect(() => {
    const fetchTechnicianTransactions = async () => {
      if (!auth.currentUser) return;
      try {
        setLoading(true);
        const techId = auth.currentUser.uid;

        const q = query(
          collection(db, "orders"),
          where("acceptedTechnicianId", "==", techId)
        );
        
        const querySnapshot = await getDocs(q);
        const allOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // تصفية الطلبات المكتملة والمغلقة فقط
        const closedOrders = allOrders.filter(order => order.status === 'completed');
        
        setCompletedOrders(closedOrders);
      } catch (error) {
        console.error("Error fetching technician transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicianTransactions();
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
          <h1 className="text-lg font-extrabold text-slate-900">سجل معاملات الفني</h1>
          <span className="text-xs text-slate-500">عرض العمليات والأرباح المكتملة التي تمت وتم إغلاقها بنجاح</span>
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
            جاري تحميل سجل معاملات الفني...
          </div>
        ) : completedOrders.length === 0 ? (
          <div className="text-center py-20 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 flex flex-col items-center gap-3 shadow-lg">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl">📄</div>
            <h3 className="text-base font-extrabold text-slate-900">لا توجد معاملات مكتملة حتى الآن</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              العمليات التي تقوم بإغلاقها من قسم "تتبع الطلب" ستظهر هنا مباشرة كمرجع لسجل معاملاتك وأرباحك.
            </p>
          </div>
        ) : (
          completedOrders.map((order) => {
            const totalAmount = order.totalOrderAmount || order.fixedPrice || 200;

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
                      <h4 className="text-xs font-extrabold text-slate-900">{order.serviceCategory} - {order.title || 'طلب صيانة'}</h4>
                      <p className="text-[11px] text-slate-400">عملية مكتملة ومغلقة بنجاح</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    +{totalAmount} ج.م
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex flex-col sm:flex-row justify-between gap-2 pt-1">
                  <p><span className="font-bold text-slate-800">اسم العميل:</span> {order.clientName || 'عميل Orbix'}</p>
                  <p><span className="font-bold text-slate-800">تفاصيل الصيانة:</span> {order.serviceDescription || order.description || 'صيانة عامة'}</p>
                  {order.partsDescription && (
                    <p><span className="font-bold text-slate-800">قطع الغيار:</span> {order.partsDescription}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}