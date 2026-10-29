import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, increment, addDoc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';
import Chat from './Chat';

export default function TechnicianOrderTracking({ userData, onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // حالة نافذة إدخال قطع الغيار والصيانة وأسعارها
  const [selectedOrderForParts, setSelectedOrderForParts] = useState(null);
  const [partsDescription, setPartsDescription] = useState('');
  const [partsPrice, setPartsPrice] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [submittingParts, setSubmittingParts] = useState(false);

  // حالة التنبيهات والرسائل الداخلية للبرنامج
  const [appMessage, setAppMessage] = useState(null);

  const showAppMessage = (text, type = 'success') => {
    setAppMessage({ text, type });
    setTimeout(() => {
      setAppMessage(null);
    }, 4000);
  };

  // حالة فتح الشات
  const [activeChatOrder, setActiveChatOrder] = useState(null);

  // جلب الطلبات الخاصة بالفني وقيد التتبع
  const fetchTrackedOrders = async () => {
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

      const activeOrders = allOrders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
      setOrders(activeOrders);
    } catch (error) {
      console.error("Error fetching tracked orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackedOrders();
  }, []);

  // تحديث حالة التحرك إلى العميل (المربع الثاني)
  const handleMovedToClient = async (orderId) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        technicianMoved: true,
        movedAt: serverTimestamp()
      });

      showAppMessage('تم تحديث حالتك: لقد تحركت إلى العميل بنجاح.');
      fetchTrackedOrders();
    } catch (error) {
      console.error("Error updating move status:", error);
      showAppMessage('حدث خطأ أثناء تحديث حالة التحرك.', 'error');
    }
  };

  // إرسال تفاصيل قطع الغيار والصيانة والأسعار (مع إضافة 200 ج.م رسوم الزيارة الثابتة)
  const handleSavePartsAndService = async (e) => {
    e.preventDefault();
    if (!selectedOrderForParts) return;

    try {
      setSubmittingParts(true);
      const orderRef = doc(db, "orders", selectedOrderForParts.id);
      
      const visitFee = 200; // رسوم الزيارة الثابتة الأساسية
      const pPrice = Number(partsPrice) || 0;
      const sPrice = Number(servicePrice) || 0;
      
      // الإجمالي = رسوم الزيارة (200) + سعر الصيانة + ثمن قطع الغيار
      const totalAmount = visitFee + sPrice + pPrice;

      await updateDoc(orderRef, {
        partsDescription: partsDescription || 'لا توجد قطع غيار',
        partsCost: pPrice,
        serviceDescription: serviceDescription || 'صيانة عامة',
        serviceCost: sPrice,
        visitFee: visitFee,
        totalOrderAmount: totalAmount,
        workFinished: true,
        workFinishedAt: serverTimestamp()
      });

      showAppMessage('تم حفظ تفاصيل الصيانة وقطع الغيار (شاملة رسوم الزيارة 200 ج.م) وإرسالها للعميل بنجاح.');
      setSelectedOrderForParts(null);
      setPartsDescription('');
      setPartsPrice('');
      setServiceDescription('');
      setServicePrice('');
      fetchTrackedOrders();
    } catch (error) {
      console.error("Error saving parts and service:", error);
      showAppMessage('حدث خطأ أثناء حفظ التفاصيل.', 'error');
    } finally {
      setSubmittingParts(false);
    }
  };

  // إغلاق العملية نهائياً وتطبيق نظام العمولات (2.5% من العميل + 2.5% من الفني = 5% للشركة)
  const handleCompleteOrder = async (order) => {
    try {
      const orderRef = doc(db, "orders", order.id);
      const baseAmount = order.totalOrderAmount || 200;

      // حساب العمولات بدقة
      const clientCommission = baseAmount * 0.025; // 2.5% عمولة العميل
      const providerCommission = baseAmount * 0.025; // 2.5% عمولة الفني
      const totalCompanyEarnings = clientCommission + providerCommission; // 5% إجمالي أرباح الشركة
      
      const totalClientPayable = baseAmount + clientCommission; // ما يدفعه العميل إجمالاً
      const netProviderPayout = baseAmount - providerCommission;   // ما يستحقه الفني صافياً

      // 1. تحديث حالة الطلب إلى مكتمل وحفظ تفاصيل الحسابات المالية
      await updateDoc(orderRef, {
        status: 'completed',
        totalClientPaid: totalClientPayable,
        providerPayout: netProviderPayout,
        companyEarnings: totalCompanyEarnings,
        technicianEarnings: netProviderPayout,
        completedAt: serverTimestamp()
      });

      // 2. تسجيل أرباح الشركة في جدول company_earnings
      await addDoc(collection(db, "company_earnings"), {
        orderId: order.id,
        clientId: order.clientId || "unknown_client",
        providerId: auth.currentUser.uid,
        baseOrderAmount: baseAmount,
        clientCommission: clientCommission,
        providerCommission: providerCommission,
        netCompanyEarnings: totalCompanyEarnings,
        totalClientPaid: totalClientPayable,
        providerPayout: netProviderPayout,
        status: "Completed",
        createdAt: serverTimestamp()
      });

      // 3. تحديث محفظة الشركة المركزية (platform_finances/main_wallet)
      const companyWalletRef = doc(db, "platform_finances", "main_wallet");
      const walletSnap = await getDoc(companyWalletRef);
      if (walletSnap.exists()) {
        await updateDoc(companyWalletRef, {
          totalBalance: increment(totalCompanyEarnings),
          totalTransactionsCount: increment(1),
          lastUpdated: serverTimestamp()
        });
      } else {
        await setDoc(companyWalletRef, {
          totalBalance: totalCompanyEarnings,
          totalTransactionsCount: 1,
          lastUpdated: serverTimestamp()
        });
      }

      // 4. تحديث محفظة الفني (provider_wallets أو users) بالصافي المستحق
      const providerWalletRef = doc(db, "provider_wallets", auth.currentUser.uid);
      const pWalletSnap = await getDoc(providerWalletRef);
      if (pWalletSnap.exists()) {
        await updateDoc(providerWalletRef, {
          pendingBalance: increment(netProviderPayout),
          lastUpdated: serverTimestamp()
        });
      } else {
        await setDoc(providerWalletRef, {
          pendingBalance: netProviderPayout,
          lastUpdated: serverTimestamp()
        });
      }

      // تحديث رصيد الفني في بروفايله أيضاً للتوافق
      const techUserRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(techUserRef, {
        walletBalance: increment(netProviderPayout)
      }).catch(() => {});

      // 5. إرسال إشعار تفصيلي للفني بالعملية والمبلغ المضاف
      await addDoc(collection(db, "notifications"), {
        userId: auth.currentUser.uid,
        title: "تم إغلاق العملية بنجاح",
        message: `تم إغلاق الطلب بقيمة أساسية ${baseAmount} ج.م، وتم إضافة صافي مبلغ ${netProviderPayout.toFixed(2)} ج.م إلى محفظتك (بعد خصم عمولة المنصة).`,
        type: "order_completed",
        orderId: order.id,
        createdAt: serverTimestamp(),
        read: false
      });

      showAppMessage(`تم إغلاق العملية بنجاح! وتم إضافة صافي مبلغ ${netProviderPayout.toFixed(2)} ج.م إلى محفظتك.`);
      fetchTrackedOrders();
    } catch (error) {
      console.error("Error completing order:", error);
      showAppMessage('حدث خطأ أثناء إغلاق العملية.', 'error');
    }
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

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex flex-col font-cairo bg-cover bg-center bg-no-repeat overflow-hidden" 
      style={{ backgroundImage: `url(${bgWaves})` }} 
      dir="rtl"
    >
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">تتبع الطلب</h1>
          <span className="text-xs text-slate-500">متابعة مراحل التنفيذ، تفاصيل الصيانة وقطع الغيار، وأرباح العمليات</span>
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

      {appMessage && (
        <div className={`mx-6 mt-4 p-4 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between transition-all duration-300 z-40 ${
          appMessage.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <span>{appMessage.text}</span>
          <button onClick={() => setAppMessage(null)} className="text-slate-400 hover:text-slate-700 font-extrabold">✕</button>
        </div>
      )}

      {selectedOrderForParts && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSavePartsAndService} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">تفاصيل الصيانة وقطع الغيار (رسوم الزيارة 200 ج.م ثابتة)</h3>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">قطع الغيار (إن وجدت)</label>
              <input 
                type="text" 
                value={partsDescription}
                onChange={(e) => setPartsDescription(e.target.value)}
                placeholder="اكتب قطع الغيار المطلوبة..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">سعر قطع الغيار (ج.م)</label>
              <input 
                type="number" 
                value={partsPrice}
                onChange={(e) => setPartsPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">نوع الصيانة أو الإصلاح</label>
              <input 
                type="text" 
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="اكتب تفاصيل الصيانة..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">سعر أجر الصيانة (ج.م)</label>
              <input 
                type="number" 
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-[11px] text-indigo-900 flex justify-between font-bold">
              <span>رسوم الزيارة الثابتة:</span>
              <span>200 ج.م</span>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="submit"
                disabled={submittingParts}
                className="flex-1 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
              >
                {submittingParts ? 'جاري الحفظ...' : 'حفظ وإرسال للعميل ✓'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderForParts(null)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-5 overflow-y-auto">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs font-bold">
            جاري تحميل الطلبات قيد التتبع...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 flex flex-col items-center gap-3 shadow-lg">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center text-3xl">📍</div>
            <h3 className="text-base font-extrabold text-slate-900">لا توجد طلبات قيد التنفيذ حالياً</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              الطلبات التي تقبلها أو تتم الموافقة عليها ستظهر هنا لمتابعتها.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const visitFee = order.visitFee || 200;
            const partsCost = order.partsCost || 0;
            const serviceCost = order.serviceCost || 0;
            const totalAmount = order.totalOrderAmount || (visitFee + partsCost + serviceCost);
            const isClientPaid = order.clientPaid === true;
            const isWorkFinished = order.workFinished === true;

            return (
              <div 
                key={order.id} 
                className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col gap-5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 overflow-hidden border border-indigo-200 flex items-center justify-center shrink-0">
                      {order.clientImage ? (
                        <img src={order.clientImage} alt="Client" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base font-extrabold text-indigo-700">{order.clientName?.charAt(0) || '👤'}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{order.clientName || 'عميل Orbix'}</h4>
                      <p className="text-[11px] text-slate-500">{order.title || order.serviceCategory || 'طلب صيانة'}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveChatOrder(order)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>💬</span>
                    <span>مراسلة العميل</span>
                  </button>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-1.5">
                  <p><span className="font-bold text-slate-800">الوصف:</span> {order.description || 'لا توجد تفاصيل'}</p>
                  {order.address && <p><span className="font-bold text-slate-800">العنوان:</span> 📍 {order.address}</p>}
                  
                  <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>رسوم الزيارة الثابتة:</span>
                      <span className="font-bold">{visitFee} ج.م</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>أجر الصيانة ({order.serviceDescription || 'عامة'}):</span>
                      <span className="font-bold">{serviceCost} ج.م</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>قطع الغيار ({order.partsDescription || 'لا توجد'}):</span>
                      <span className="font-bold">{partsCost} ج.م</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-extrabold text-xs pt-1 border-t border-slate-200">
                      <span>الإجمالي الكلي:</span>
                      <span>{totalAmount} ج.م</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shrink-0">✓</div>
                    <div>
                      <span className="text-[10px] text-emerald-700 block font-bold">المرحلة الأولى</span>
                      <h5 className="text-xs font-extrabold text-emerald-900">تم قبول الطلب</h5>
                    </div>
                  </div>

                  <div className={`border rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-xs transition ${order.technicianMoved ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${order.technicianMoved ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {order.technicianMoved ? '✓' : '2'}
                      </div>
                      <div>
                        <span className={`text-[10px] block font-bold ${order.technicianMoved ? 'text-emerald-700' : 'text-slate-500'}`}>المرحلة الثانية</span>
                        <h5 className={`text-xs font-extrabold ${order.technicianMoved ? 'text-emerald-900' : 'text-slate-800'}`}>التحرك للعميل</h5>
                      </div>
                    </div>
                    {!order.technicianMoved && (
                      <button
                        type="button"
                        onClick={() => handleMovedToClient(order.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-2 rounded-xl transition cursor-pointer shadow-xs"
                      >
                        أتحرك الآن
                      </button>
                    )}
                  </div>

                  <div className={`border rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-xs transition ${isClientPaid ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${isClientPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {isClientPaid ? '✓' : '3'}
                      </div>
                      <div>
                        <span className={`text-[10px] block font-bold ${isClientPaid ? 'text-emerald-700' : 'text-slate-500'}`}>المرحلة الثالثة</span>
                        <h5 className={`text-xs font-extrabold ${isClientPaid ? 'text-emerald-900' : 'text-slate-800'}`}>
                          {isClientPaid ? 'تم دفع العميل بنجاح' : 'إنهاء العمل والدفع'}
                        </h5>
                      </div>
                    </div>

                    {!isWorkFinished ? (
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForParts(order)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-3 py-2 rounded-xl transition cursor-pointer shadow-xs"
                      >
                        قطع الغيار والصيانة
                      </button>
                    ) : !isClientPaid ? (
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                        بانتظار دفع العميل
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCompleteOrder(order)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-2 rounded-xl transition cursor-pointer shadow-xs animate-pulse"
                      >
                        إغلاق العملية 💰
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