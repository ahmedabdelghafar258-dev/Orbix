import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';

export default function Notifications({ onBack }) {
  const [notificationsList, setNotificationsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب إشعارات المستخدم الحالي من فايربيز
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!auth.currentUser) return;
      try {
        setLoading(true);
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const notifs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // ترتيب الإشعارات تنازلياً حسب الوقت (الأحدث أولاً) لو كان الحقل موجوداً
        notifs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        
        setNotificationsList(notifs);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 font-cairo bg-cover bg-center bg-no-repeat overflow-hidden page-transition" 
      style={{ backgroundImage: `url(${bgWaves})` }} 
      dir="rtl"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-2xl w-full max-h-[85vh] p-8 shadow-2xl border border-slate-100 flex flex-col relative overflow-y-auto">
        
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
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">الإشعارات والتنبيهات</h2>
          <p className="text-xs text-slate-500">تابع أحدث مستجدات طلبات الصيانة وعروض الفنيين لحظة بلحظة</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500 text-xs font-bold">
            جاري تحميل الإشعارات...
          </div>
        ) : notificationsList.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
              🔔
            </div>
            <h3 className="text-base font-extrabold text-slate-900">لا توجد إشعارات جديدة</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              ستظهر هنا كافة التنبيهات فور تفاعل الفنيين مع طلباتك أو قبول العروض.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notificationsList.map((notif) => (
              <div key={notif.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3.5 transition hover:border-purple-200">
                <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center text-lg shrink-0 mt-0.5">
                  📌
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-extrabold text-slate-900">{notif.title || 'تنبيه جديد'}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}