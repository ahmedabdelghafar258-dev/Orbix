import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';

export default function MyOffers({ userData, onBack, onTrackOrder }) {
  const [offersList, setOffersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyOrdersWithOffers = async () => {
    if (!auth.currentUser) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, "orders"),
        where("clientId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const orders = [];
      querySnapshot.forEach((document) => {
        const data = document.data();
        orders.push({ id: document.id, ...data });
      });
      setOffersList(orders);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrdersWithOffers();
  }, []);

  const handleAcceptOffer = async (orderId, offer) => {
    try {
      const technicianName = offer.technicianName || 'فني معتمد';

      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: 'in_progress',
        acceptedTechnicianId: offer.technicianId,
        acceptedTechnicianName: technicianName,
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, "notifications"), {
        userId: auth.currentUser.uid,
        title: "تم قبول العرض بنجاح!",
        message: `تم قبول طلبك بواسطة الفني ${technicianName}, جاري الانتقال لتتبع الطلب.`,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "notifications"), {
        userId: offer.technicianId,
        title: "تم قبول عرضك!",
        message: `قام العميل بقبول عرضك على طلب الصيانة.`,
        createdAt: serverTimestamp()
      });

      alert("تم قبول العرض بنجاح!");
      
      if (onTrackOrder) {
        onTrackOrder(orderId);
      } else {
        onBack();
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      alert("حدث خطأ أثناء قبول العرض، حاول مرة أخرى.");
    }
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 font-cairo bg-cover bg-center bg-no-repeat overflow-hidden page-transition" 
      style={{ backgroundImage: `url(${bgWaves})` }} 
      dir="rtl"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-2xl w-full max-h-[85vh] p-8 shadow-2xl border border-slate-100 flex flex-col relative overflow-y-auto">
        
        <div className="flex justify-start mb-2">
          <button 
            type="button" 
            onClick={onBack}
            className="text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <span>←</span>
            <span>الرجوع للصفحة الرئيسية</span>
          </button>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">عروض الأسعار لطلباتك</h2>
          <p className="text-xs text-slate-500">تابع عروض الفنيين والعروض المضادة على طلبات الصيانة الخاصة بك</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500 text-xs font-bold">
            جاري تحميل العروض...
          </div>
        ) : offersList.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center text-2xl">
              📭
            </div>
            <p className="text-xs font-bold text-slate-600">لا توجد طلبات أو عروض متاحة حالياً</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {offersList.map((order) => (
              <div key={order.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                      {order.serviceCategory || 'صيانة عامة'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-2">العنوان: {order.address}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">الوصف: {order.description}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                    order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    order.status === 'in_progress' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {order.status === 'pending' ? 'بانتظار العروض' : 'قيد التنفيذ'}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h5 className="text-[11px] font-extrabold text-slate-700">عروض الفنيين:</h5>
                  {(!order.offers || order.offers.length === 0) ? (
                    <p className="text-[11px] text-slate-400 italic">لم يتم تقديم عروض مضادة أو أسعار من الفنيين حتى الآن.</p>
                  ) : (
                    order.offers.map((offer, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-purple-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{offer.technicianName || 'فني معتمد'}</p>
                          <p className="text-[11px] text-purple-700 font-extrabold mt-0.5">السعر المقترح: {offer.price} جنيه</p>
                        </div>
                        {order.status !== 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => handleAcceptOffer(order.id, offer)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-sm"
                          >
                            قبول العرض
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}