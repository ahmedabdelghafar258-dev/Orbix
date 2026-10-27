import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc, increment } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';
import Chat from './Chat';

export default function OrderTracking({ userData, onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالة نافذة الدفع
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // حالة نافذة تقييم الفني (بعد إغلاق العملية)
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // حالة رسائل التنبيه الداخلية للبرنامج
  const [appMessage, setAppMessage] = useState(null);

  const showAppMessage = (text, type = 'success') => {
    setAppMessage({ text, type });
    setTimeout(() => {
      setAppMessage(null);
    }, 4000);
  };

  // حالة فتح الشات مع الفني
  const [activeChatOrder, setActiveChatOrder] = useState(null);

  // جلب طلبات العميل قيد التتبع
  const fetchClientOrders = async () => {
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

      // تصفية الطلبات غير المكتملة أو الملغاة
      const activeOrders = allOrders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
      setOrders(activeOrders);
    } catch (error) {
      console.error("Error fetching client orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientOrders();
  }, []);

  // تأكيد الدفع مع حساب عمولة المنصة 2.5%
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrderForPayment || !paymentPhone) {
      showAppMessage('الرجاء إدخال رقم الهاتف أو المحفظة لإتمام الدفع.', 'error');
      return;
    }

    try {
      setProcessingPayment(true);
      const orderRef = doc(db, "orders", selectedOrderForPayment.id);

      const baseAmount = selectedOrderForPayment.totalOrderAmount || selectedOrderForPayment.fixedPrice || 200;
      const finalAmountWithCommission = Number((baseAmount * 1.025).toFixed(2));

      await updateDoc(orderRef, {
        clientPaid: true,
        paymentPhone: paymentPhone,
        totalOrderAmount: finalAmountWithCommission,
        paidAt: serverTimestamp()
      });

      showAppMessage('تمت عملية الدفع بنجاح! يمكنك الآن إغلاق العملية.');
      setSelectedOrderForPayment(null);
      setPaymentPhone('');
      fetchClientOrders();
    } catch (error) {
      console.error("Error processing payment:", error);
      showAppMessage('حدث خطأ أثناء تنفيذ عملية الدفع.', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  // إغلاق العملية من قِبل العميل (وتحويل الأرباح لمحفظة الفني)
  const handleCloseServiceByClient = async (order) => {
    try {
      const orderRef = doc(db, "orders", order.id);
      const totalAmount = order.totalOrderAmount || 200;

      // 1. تحديث حالة الطلب إلى مكتمل
      await updateDoc(orderRef, {
        status: 'completed',
        closedByClient: true,
        completedAt: serverTimestamp()
      });

      // 2. تحديث محفظة الفني تلقائياً
      if (order.acceptedTechnicianId) {
        const techUserRef = doc(db, "users", order.acceptedTechnicianId);
        await updateDoc(techUserRef, {
          walletBalance: increment(totalAmount)
        });
      }

      showAppMessage('تم إغلاق الخدمة بنجاح، شكراً لاستخدامك Orbix!');
      setSelectedOrderForReview(order); // فتح نافذة التقييم
      fetchClientOrders();
    } catch (error) {
      console.error("Error closing service:", error);
      showAppMessage('حدث خطأ أثناء إغلاق العملية.', 'error');
    }
  };

  // إرسال التقييم والتعليق للفني
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedOrderForReview) return;

    try {
      setSubmittingReview(true);
      
      // حفظ التقييم في مجموعة التقييمات أو في الطلب نفسه
      await addDoc(collection(db, "reviews"), {
        orderId: selectedOrderForReview.id,
        technicianId: selectedOrderForReview.acceptedTechnicianId,
        clientId: auth.currentUser.uid,
        clientName: userData?.fullName || 'عميل Orbix',
        rating: rating,
        comment: reviewComment || 'بدون تعليق',
        createdAt: serverTimestamp()
      });

      showAppMessage('تم إرسال تقييمك بنجاح. شكراً لك!');
      setSelectedOrderForReview(null);
      setReviewComment('');
    } catch (error) {
      console.error("Error submitting review:", error);
      showAppMessage('حدث خطأ أثناء إرسال التقييم.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (activeChatOrder) {
    const clientImage = userData?.profileimage || userData?.profileImage || '';
    return (
      <Chat 
        orderId={activeChatOrder.id}
        recipientId={activeChatOrder.acceptedTechnicianId}
        recipientName={activeChatOrder.acceptedTechnicianName || 'الفني المعتمد'}
        recipientImage={activeChatOrder.technicianImage || ''}
        userImage={clientImage}
        onBack={() => setActiveChatOrder(null)}
      />
    );
  }

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex flex-col font-cairo bg-cover bg-center bg-no-repeat overflow-hidden" 
      style={{ backgroundImage: `url(${bgWaves})` }} 
      dir="rtl"
    >
      {/* شريط علوي مع زر العودة الموحد */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">تتبع الطلب</h1>
          <span className="text-xs text-slate-500">متابعة مراحل التنفيذ، قطع الغيار، ودفع المستحقات</span>
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

      {/* شريط التنبيهات والرسائل الداخلية */}
      {appMessage && (
        <div className={`mx-6 mt-4 p-4 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between transition-all duration-300 z-40 ${
          appMessage.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <span>{appMessage.text}</span>
          <button onClick={() => setAppMessage(null)} className="text-slate-400 hover:text-slate-700 font-extrabold">✕</button>
        </div>
      )}

      {/* نافذة دفع المستحقات */}
      {selectedOrderForPayment && (() => {
        const baseAmount = selectedOrderForPayment.totalOrderAmount || selectedOrderForPayment.fixedPrice || 200;
        const commission = baseAmount * 0.025;
        const totalWithCommission = baseAmount * 1.025;

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <form onSubmit={handleConfirmPayment} className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">بوابة الدفع الإلكتروني</h3>
              
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span>تكلفة الخدمة / قطع الغيار:</span>
                  <span className="font-bold">{baseAmount} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>عمولة المنصة (2.5%):</span>
                  <span>+{commission.toFixed(2)} ج.م</span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center">
                  <span className="font-extrabold text-slate-900">المبلغ الإجمالي:</span>
                  <span className="text-base font-extrabold text-emerald-600">
                    {totalWithCommission.toFixed(2)} ج.م
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">رقم الهاتف أو المحفظة للدفع</label>
                <input 
                  type="text" 
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  placeholder="مثال: 01012345678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
                >
                  {processingPayment ? 'جاري المعالجة...' : `تأكيد ودفع (${totalWithCommission.toFixed(2)} ج.م) 💳`}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForPayment(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* نافذة تقييم الفني بعد إغلاق العملية */}
      {selectedOrderForReview && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitReview} className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 text-center">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">تقييم الخدمة والفني</h3>
            
            <p className="text-xs text-slate-600">كيف كانت تجربتك مع الفني؟ نرجو تقييم الخدمة:</p>

            {/* نجوم التقييم */}
            <div className="flex justify-center gap-2 text-2xl my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`transition cursor-pointer ${star <= rating ? 'text-amber-400 scale-110' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1.5 text-right">
              <label className="text-xs font-bold text-slate-700">تعليق أو ملاحظات (اختياري)</label>
              <textarea 
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="اكتب تعليقك هنا..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 h-20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md mt-2"
            >
              {submittingReview ? 'جاري الإرسال...' : 'إرسال التقييم وإنهاء'}
            </button>
          </form>
        </div>
      )}

      {/* محتوى الصفحة */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-5 overflow-y-auto">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs font-bold">
            جاري تحميل طلباتك...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 flex flex-col items-center gap-3 shadow-lg">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center text-3xl">📍</div>
            <h3 className="text-base font-extrabold text-slate-900">لا توجد طلبات قيد التتبع حالياً</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              الطلبات التي تقبلها أو تبدأ تنفيذها ستظهر هنا لمتابعة مراحلها.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const basePrice = order.fixedPrice || order.agreedPrice || 200;
            const partsCost = order.partsCost || 0;
            const rawTotal = order.totalOrderAmount || (basePrice + partsCost);
            const displayedTotal = order.clientPaid ? rawTotal : (rawTotal * 1.025);
            
            const isTechnicianMoved = order.technicianMoved === true;
            const isWorkFinished = order.workFinished === true;
            const isClientPaid = order.clientPaid === true;

            return (
              <div 
                key={order.id} 
                className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col gap-5"
              >
                {/* رأس البطاقة: بيانات الفني وزر الشات */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 overflow-hidden border border-indigo-200 flex items-center justify-center shrink-0">
                      {order.technicianImage ? (
                        <img src={order.technicianImage} alt="Technician" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base font-extrabold text-indigo-700">{order.acceptedTechnicianName?.charAt(0) || '👨‍🔧'}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">الفني: {order.acceptedTechnicianName || 'بانتظار قبول الفني'}</h4>
                      <p className="text-[11px] text-slate-500">{order.serviceCategory} - {order.title || 'طلب صيانة'}</p>
                    </div>
                  </div>

                  {order.acceptedTechnicianId && (
                    <button
                      type="button"
                      onClick={() => setActiveChatOrder(order)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>💬</span>
                      <span>مراسلة الفني</span>
                    </button>
                  )}
                </div>

                {/* التفاصيل وقطع الغيار */}
                <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-1">
                  <p><span className="font-bold text-slate-800">وصف الطلب:</span> {order.description || 'لا توجد تفاصيل'}</p>
                  <p><span className="font-bold text-slate-800">السعر الأساسي:</span> {basePrice} ج.م</p>
                  {order.partsDescription && (
                    <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-0.5">
                      <p><span className="font-bold text-slate-800">قطع الغيار المطلوبة:</span> {order.partsDescription} ({partsCost} ج.م)</p>
                    </div>
                  )}
                  <p className="font-bold text-emerald-600 mt-1">
                    الإجمالي (شامل عمولة المنصة 2.5%): {displayedTotal.toFixed(2)} ج.م
                  </p>
                </div>

                {/* المراحل الثلاث لتتبع الطلب */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  
                  {/* المربع الأول: تم قبول الطلب */}
                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shrink-0">✓</div>
                    <div>
                      <span className="text-[10px] text-emerald-700 block font-bold">المرحلة الأولى</span>
                      <h5 className="text-xs font-extrabold text-emerald-900">تم قبول الطلب</h5>
                    </div>
                  </div>

                  {/* المربع الثاني: تحرك الفني */}
                  <div className={`border rounded-2xl p-3.5 flex items-center gap-3 shadow-xs transition ${isTechnicianMoved ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${isTechnicianMoved ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {isTechnicianMoved ? '✓' : '2'}
                    </div>
                    <div>
                      <span className={`text-[10px] block font-bold ${isTechnicianMoved ? 'text-emerald-700' : 'text-slate-500'}`}>المرحلة الثانية</span>
                      <h5 className={`text-xs font-extrabold ${isTechnicianMoved ? 'text-emerald-900' : 'text-slate-800'}`}>
                        {isTechnicianMoved ? 'تحرك الفني إليك' : 'بانتظار تحرك الفني'}
                      </h5>
                    </div>
                  </div>

                  {/* المربع الثالث: إنهاء العمل، الدفع، وإغلاق الخدمة */}
                  <div className={`border rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-xs transition ${isClientPaid ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${isClientPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {isClientPaid ? '✓' : '3'}
                      </div>
                      <div>
                        <span className={`text-[10px] block font-bold ${isClientPaid ? 'text-emerald-700' : 'text-slate-500'}`}>المرحلة الثالثة</span>
                        <h5 className={`text-xs font-extrabold ${isClientPaid ? 'text-emerald-900' : 'text-slate-800'}`}>
                          {isClientPaid ? 'تم الدفع بنجاح' : 'إنهاء العمل والدفع'}
                        </h5>
                      </div>
                    </div>

                    {!isWorkFinished ? (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        قيد التنفيذ
                      </span>
                    ) : !isClientPaid ? (
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForPayment(order)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-2 rounded-xl transition cursor-pointer shadow-xs animate-pulse"
                      >
                        ادفع الآن 💳
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCloseServiceByClient(order)}
                        className="bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl transition cursor-pointer shadow-xs animate-pulse"
                      >
                        إغلاق العملية 🔒
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })
        )}
      </main>
    </div>
  );
}