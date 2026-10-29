import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase';

export default function TechnicianChats({ userData, onBack }) {
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // خريطة لتخزين حالة نشاط كل عميل (clientId -> true/false)
  const [clientsPresence, setClientsPresence] = useState({});

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const techId = auth.currentUser?.uid || userData?.uid || userData?.id;

  // 1. تحديث نشاط الفني الحالي (Heartbeat) طالما هو فاتح شاشة المحادثات
  useEffect(() => {
    if (!techId) return;

    const techStatusRef = doc(db, 'users_presence', techId);

    const updateActiveStatus = async () => {
      try {
        await setDoc(techStatusRef, {
          lastActive: serverTimestamp(),
          isOnline: true
        }, { merge: true });
      } catch (err) {
        console.error("Error updating tech presence:", err);
      }
    };

    updateActiveStatus();
    const interval = setInterval(updateActiveStatus, 10000);

    return () => {
      clearInterval(interval);
      setDoc(techStatusRef, {
        lastActive: null,
        isOnline: false
      }, { merge: true }).catch(() => {});
    };
  }, [techId]);

  // جلب الطلبات والمحادثات النشطة للفني
  useEffect(() => {
    const fetchTechOrders = async () => {
      if (!techId) return;
      try {
        setLoading(true);
        let q = query(collection(db, "orders"), where("acceptedTechnicianId", "==", techId));
        const querySnapshot = await getDocs(q);
        let orders = querySnapshot.docs.map(document => ({
          id: document.id,
          ...document.data()
        }));

        if (orders.length === 0) {
          const qAlt = query(collection(db, "orders"), where("techId", "==", techId));
          const snapAlt = await getDocs(qAlt);
          orders = snapAlt.docs.map(document => ({
            id: document.id,
            ...document.data()
          }));
        }
        
        setActiveOrders(orders);
        if (orders.length > 0 && !selectedOrder) {
          setSelectedOrder(orders[0]);
        }
      } catch (error) {
        console.error("Error fetching technician chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTechOrders();
  }, [techId]);

  // 2. مراقبة حالة نشاط جميع العملاء المرتبطين بطلبات الفني لحظياً
  useEffect(() => {
    if (activeOrders.length === 0) return;

    // استخراج معرفات العملاء الفريدة
    const clientIds = [...new Set(activeOrders.map(order => order.clientId).filter(Boolean))];
    if (clientIds.length === 0) return;

    const unsubscribers = clientIds.map(clientId => {
      const clientStatusRef = doc(db, 'users_presence', clientId);
      return onSnapshot(clientStatusRef, (docSnap) => {
        let active = false;
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.lastActive && data.isOnline) {
            const lastActiveTime = data.lastActive.toMillis ? data.lastActive.toMillis() : new Date(data.lastActive).getTime();
            if (Date.now() - lastActiveTime < 25000) {
              active = true;
            }
          }
        }
        setClientsPresence(prev => ({ ...prev, [clientId]: active }));
      });
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [activeOrders]);

  // تتبع الرسائل غير المقروءة لكل محادثة
  useEffect(() => {
    if (!techId || activeOrders.length === 0) return;

    const unsubs = activeOrders.map(order => {
      const q = query(collection(db, 'orders', order.id, 'messages'));
      return onSnapshot(q, (snapshot) => {
        let unread = 0;
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.senderId !== techId && data.read === false) {
            unread++;
          }
        });
        setUnreadCounts(prev => ({ ...prev, [order.id]: unread }));
      });
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [activeOrders, techId]);

  // الاستماع اللحظي للرسائل وتحديث حالتها إلى مقروءة (read: true) فور فتح المحادثة
  useEffect(() => {
    if (!selectedOrder || !techId) return;

    const q = query(
      collection(db, "orders", selectedOrder.id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        if (data.senderId !== techId && data.read === false) {
          updateDoc(doc(db, "orders", selectedOrder.id, "messages", docSnap.id), {
            read: true
          }).catch(err => console.error("Error marking msg read:", err));
        }
        return {
          id: docSnap.id,
          ...data
        };
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedOrder, techId]);

  // إرسال رسالة جديدة من الفني للعميل
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedOrder || !techId) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, "orders", selectedOrder.id, "messages"), {
        text: text,
        senderId: techId,
        senderRole: 'technician',
        createdAt: serverTimestamp(),
        read: false
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(text);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col font-cairo bg-slate-50 overflow-hidden" dir="rtl">
      
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-20">
        <div>
          <h1 className="text-lg font-bold text-slate-900">محادثات العملاء</h1>
          {isOnline ? (
            <span className="text-[10px] text-emerald-600 font-bold block">متصل بالإنترنت 🟢</span>
          ) : (
            <span className="text-[10px] text-slate-400 font-bold block">غير متصل بالإنترنت 🔴</span>
          )}
        </div>
        <button 
          type="button" 
          onClick={onBack}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
        >
          <span>←</span>
          <span>العودة إلى الصفحة الرئيسية</span>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto p-6 gap-6">
        
        {/* قائمة المحادثات الجانبية */}
        <div className="w-1/3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-700 text-sm">العملاء النشطون</div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <p className="p-4 text-center text-slate-400 text-xs">جاري تحميل المحادثات...</p>
            ) : activeOrders.length === 0 ? (
              <p className="p-4 text-center text-slate-400 text-xs">لا توجد محادثات أو طلبات مسندة إليك حاليًا.</p>
            ) : (
              activeOrders.map(order => {
                const unread = unreadCounts[order.id] || 0;
                const isClientActive = clientsPresence[order.clientId];

                return (
                  <div 
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 cursor-pointer transition flex items-center justify-between ${selectedOrder?.id === order.id ? 'bg-indigo-50 border-r-4 border-indigo-600' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 overflow-hidden border border-indigo-200 flex items-center justify-center shrink-0">
                          {order.clientImage ? (
                            <img src={order.clientImage} alt="Client" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-extrabold text-indigo-700">
                              {order.clientName?.charAt(0) || '👤'}
                            </span>
                          )}
                        </div>
                        {/* نقطة الاتصال الخضراء المصغرة على الصورة */}
                        {isClientActive && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                          {order.clientName || 'عميل Orbix'}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {order.title || order.serviceCategory || 'صيانة عامة'}
                        </p>
                        {isClientActive ? (
                          <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">متصل الآن 🟢</span>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold block mt-0.5">غير متصل</span>
                        )}
                      </div>
                    </div>

                    {unread > 0 && (
                      <span className="bg-rose-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* نافذة المحادثة الفورية */}
        <div className="flex-2 flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {selectedOrder ? (
            <>
              <div className="p-4 border-b border-slate-100 font-bold text-slate-800 bg-slate-50/50 text-sm flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>محادثة مع العميل: <span className="text-indigo-600 font-extrabold">{selectedOrder.clientName || 'عميل Orbix'}</span></span>
                  {clientsPresence[selectedOrder.clientId] && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">متصل الآن 🟢</span>
                  )}
                </div>
                <span className="text-xs text-slate-500">الطلب: {selectedOrder.title || selectedOrder.serviceCategory}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {messages.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs mt-10">لا توجد رسائل سابقة. ابدأ المحادثة الآن مع العميل!</p>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === techId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-xs ${
                          isMe ? 'bg-indigo-600 text-white rounded-bl-none' : 'bg-slate-200 text-slate-800 rounded-br-none'
                        }`}>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex gap-2 bg-white">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب ردك للعميل هنا..."
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  إرسال
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              اختر محادثة من القائمة الجانبية لعرضها والبدء في التواصل الفوري.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}