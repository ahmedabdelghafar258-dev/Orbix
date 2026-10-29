import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';
import Chat from './Chat';

export default function AvailableOrders({ userData, onBack, onOrderAccepted }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [ignoredOrderIds, setIgnoredOrderIds] = useState(() => {
    try {
      const saved = localStorage.getItem('orbix_ignored_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeChatOrder, setActiveChatOrder] = useState(null);
  const [successModalOrder, setSuccessModalOrder] = useState(null); // نافذة تأكيد قبول الطلب

  const fetchAvailableOrders = async () => {
    if (!auth.currentUser) return;
    try {
      setLoading(true);

      const techSpecialization = (userData?.serviceCategory || userData?.specialization || userData?.category || '').trim();

      const q = query(
        collection(db, "orders"),
        where("status", "==", "pending")
      );
      
      const querySnapshot = await getDocs(q);
      let allOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (techSpecialization) {
        allOrders = allOrders.filter(order => {
          const orderCategory = (order.serviceCategory || order.category || '').trim();
          return orderCategory.toLowerCase() === techSpecialization.toLowerCase();
        });
      }

      allOrders = allOrders.filter(order => {
        const notTaken = !order.acceptedTechnicianId && (!order.techId || order.techId === auth.currentUser.uid);
        const notIgnored = !ignoredOrderIds.includes(order.id);
        return notTaken && notIgnored;
      });

      setOrders(allOrders);
    } catch (error) {
      console.error("Error fetching available orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableOrders();
  }, [userData]);

  const handleAcceptOrder = async (order) => {
    try {
      const orderRef = doc(db, "orders", order.id);
      
      await updateDoc(orderRef, {
        status: 'accepted',
        fixedPrice: 200,
        acceptedTechnicianId: auth.currentUser.uid,
        acceptedTechnicianName: userData?.fullName || 'فني معتمد',
        technicianImage: userData?.profileimage || userData?.profileImage || '',
        acceptedAt: serverTimestamp()
      });

      await addDoc(collection(db, "notifications"), {
        userId: auth.currentUser.uid,
        title: "تم قبول الطلب بنجاح",
        message: `تم قبول طلب الصيانة بنجاح وتم نقله إلى قسم تتبع الطلب.`,
        type: "order_accepted",
        orderId: order.id,
        createdAt: serverTimestamp(),
        read: false
      });

      // إظهار نافذة التأكيد الاحترافية للمستخدم
      setSuccessModalOrder(order);
      
    } catch (error) {
      console.error("Error accepting order:", error);
      alert('حدث خطأ أثناء قبول الطلب.');
    }
  };

  const handleProceedTracking = (order) => {
    setSuccessModalOrder(null);
    if (typeof onOrderAccepted === 'function') {
      onOrderAccepted({ ...order, status: 'accepted' });
    } else {
      fetchAvailableOrders();
    }
  };

  const handleIgnoreOrder = (orderId) => {
    const updatedIgnored = [...ignoredOrderIds, orderId];
    setIgnoredOrderIds(updatedIgnored);
    try {
      localStorage.setItem('orbix_ignored_orders', JSON.stringify(updatedIgnored));
    } catch (e) {
      console.error(e);
    }
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  if (activeChatOrder) {
    const techImage = userData?.profileimage || userData?.profileImage || '';
    return (
      <Chat 
        orderId={activeChatOrder.id}
        recipientId={activeChatOrder.clientId}
        recipientName={activeChatOrder.clientName || 'العميل'}
        recipientImage={activeChatOrder.clientImage || ''}
        userImage={techImage}
        onBack={() => setActiveChatOrder(null)}
      />
    );
  }

  const currentTechSpec = userData?.serviceCategory || userData?.specialization || userData?.category || 'غير محدد';

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex flex-col font-cairo bg-cover bg-center bg-no-repeat overflow-hidden" 
      style={{ backgroundImage: `url(${bgWaves})` }} 
      dir="rtl"
    >
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">الطلبات المتاحة لتخصصك</h1>
          <span className="text-xs text-slate-500">التخصص الحالي: <strong className="text-indigo-600">{currentTechSpec}</strong> (السعر الثابت: 200 ج.م)</span>
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

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-4 overflow-y-auto">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs font-bold">
            جاري البحث عن الطلبات المتاحة لتخصصك...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 flex flex-col items-center gap-3 shadow-lg">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-3xl">🛠️</div>
            <h3 className="text-base font-extrabold text-slate-900">لا توجد طلبات متاحة في تخصصك ({currentTechSpec}) حالياً</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              تأكد أن بروفايل الفني يحتوي على نفس قيمة التخصص وأن العميل أنشأ طلباً بنفس القسم.
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 rounded-full bg-indigo-100 overflow-hidden border-2 border-indigo-200 flex items-center justify-center shrink-0 shadow-sm">
                  {order.clientImage ? (
                    <img src={order.clientImage} alt="Client" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-extrabold text-indigo-700">{order.clientName?.charAt(0) || '👤'}</span>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex-1 flex flex-col gap-1.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900">{order.clientName || 'عميل Orbix'}</h4>
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      القسم: {order.serviceCategory || order.category}
                    </span>
                  </div>
                  
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    الوصف: <span className="font-normal text-slate-600">{order.description || 'لا توجد تفاصيل'}</span>
                  </p>

                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-200">
                    {order.address && (
                      <span className="text-[11px] text-slate-500">
                        <span className="font-bold text-slate-700">العنوان:</span> 📍 {order.address}
                      </span>
                    )}
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      السعر: 200 ج.م
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setActiveChatOrder(order)}
                  title="مراسلة العميل"
                  className="w-11 h-11 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl border border-indigo-200 flex items-center justify-center text-lg transition cursor-pointer shadow-sm"
                >
                  💬
                </button>

                <button
                  type="button"
                  onClick={() => handleAcceptOrder(order)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition cursor-pointer shadow-md"
                >
                  قبول ✓
                </button>

                <button
                  type="button"
                  onClick={() => handleIgnoreOrder(order.id)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-3 rounded-xl transition cursor-pointer"
                >
                  تجاهل ✕
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* نافذة تأكيد قبول الطلب الاحترافية */}
      {successModalOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl shadow-inner">
              ✓
            </div>
            <h3 className="text-base font-extrabold text-slate-900">تم قبول الطلب بنجاح!</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              تم تحويل الطلب إلى قائمة طلباتك المقبولة، ونقلك تلقائياً إلى صفحة التتبع للبدء في تنفيذ الخدمة.
            </p>
            <button
              type="button"
              onClick={() => handleProceedTracking(successModalOrder)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-md cursor-pointer"
            >
              الانتقال لتتبع الطلب ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}