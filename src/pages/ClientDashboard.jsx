import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import NewOrder from './NewOrder'; 
import MyOffers from './MyOffers'; 
import OrderTracking from './OrderTracking'; 
import Transactions from './Transactions'; 
import Notifications from './Notifications'; 
import AccountSettings from './AccountSettings'; 
import Chat from './Chat'; 
import Wallet from './Wallet';
import bgWaves from '../assets/bg-waves.png'; 
import logo from '../assets/logo.png';

export default function ClientDashboard({ userData: initialUserData }) {
  const [userData, setUserData] = useState(initialUserData);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // عداد الرسائل غير المقروءة لكل أوردر
  const [unreadCounts, setUnreadCounts] = useState({});
  
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('orbix_client_view') || 'dashboard';
  });
  
  const [selectedChatOrder, setSelectedChatOrder] = useState(() => {
    const savedOrder = localStorage.getItem('orbix_selected_chat_order');
    return savedOrder ? JSON.parse(savedOrder) : null;
  });

  useEffect(() => {
    localStorage.setItem('orbix_client_view', currentView);
  }, [currentView]);

  useEffect(() => {
    if (selectedChatOrder) {
      localStorage.setItem('orbix_selected_chat_order', JSON.stringify(selectedChatOrder));
    } else {
      localStorage.removeItem('orbix_selected_chat_order');
    }
  }, [selectedChatOrder]);

  const fetchOrders = async () => {
    if (!auth.currentUser) return;
    try {
      setLoadingOrders(true);
      const q = query(collection(db, "orders"), where("clientId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(userOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // الاستماع اللحظي للرسائل غير المقروءة لكل طلب يحتوي على فني
  useEffect(() => {
    if (!auth.currentUser) return;
    const activeOrders = orders.filter(o => o.acceptedTechnicianId);
    if (activeOrders.length === 0) return;

    const unsubs = activeOrders.map(order => {
      const q = query(collection(db, 'orders', order.id, 'messages'));
      return onSnapshot(q, (snapshot) => {
        let unread = 0;
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          // الرسائل التي لم يقرأها العميل (أرسلها الفني ولم يتم قراءتها)
          if (data.senderId !== auth.currentUser.uid && data.read === false) {
            unread++;
          }
        });
        setUnreadCounts(prev => ({ ...prev, [order.id]: unread }));
      });
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [orders]);

  // إجمالي عدد الرسائل غير المقروءة للعميل لعرضها على الكارد بره
  const totalUnreadMessages = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const clientName = userData?.fullName || 'عميل Orbix';
  const firstLetter = clientName.charAt(0);
  const profileImage = userData?.profileimage || userData?.profileImage || '';

  if (currentView === 'new_order') {
    return <NewOrder userData={userData} onBack={() => { setCurrentView('dashboard'); fetchOrders(); }} />;
  }

  if (currentView === 'my_offers') {
    return (
      <MyOffers 
        userData={userData} 
        onBack={() => { setCurrentView('dashboard'); fetchOrders(); }} 
        onTrackOrder={() => { setCurrentView('order_tracking'); }} 
      />
    );
  }

  if (currentView === 'order_tracking') {
    return (
      <OrderTracking 
        onBack={() => { setCurrentView('dashboard'); fetchOrders(); }} 
      />
    );
  }

  if (currentView === 'transactions') {
    return (
      <Transactions 
        onBack={() => { setCurrentView('dashboard'); fetchOrders(); }} 
      />
    );
  }

  if (currentView === 'wallet') {
    return (
      <Wallet 
        userData={userData} 
        onBack={() => { setCurrentView('dashboard'); fetchOrders(); }} 
      />
    );
  }

  if (currentView === 'notifications') {
    return (
      <Notifications 
        onBack={() => { setCurrentView('dashboard'); fetchOrders(); }} 
      />
    );
  }

  if (currentView === 'settings') {
    return (
      <AccountSettings 
        userData={userData} 
        onBack={() => { setCurrentView('dashboard'); fetchOrders(); }} 
        onUpdateUserData={(updatedData) => setUserData(updatedData)}
      />
    );
  }

  if (currentView === 'chat_room' && selectedChatOrder) {
    return (
      <Chat 
        orderId={selectedChatOrder.id}
        recipientId={selectedChatOrder.acceptedTechnicianId}
        recipientName={selectedChatOrder.acceptedTechnicianName || 'الفني المسؤول'}
        recipientImage={selectedChatOrder.technicianImage || ''}
        userImage={profileImage}
        onBack={() => setCurrentView('messages')}
      />
    );
  }

  if (currentView === 'messages') {
    const activeOrdersWithTechnician = orders.filter(o => o.acceptedTechnicianId);

    return (
      <div 
        className="fixed inset-0 w-screen h-screen flex flex-col font-cairo bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: `url(${bgWaves})` }}
        dir="rtl"
      >
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <h1 className="text-lg font-extrabold text-slate-900">الرسائل والمحادثات</h1>
          <button 
            type="button" 
            onClick={() => setCurrentView('dashboard')}
            className="text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <span>←</span>
            <span>العودة للصفحة الرئيسية</span>
          </button>
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col gap-4 my-4 overflow-y-auto">
          {activeOrdersWithTechnician.length === 0 ? (
            <div className="text-center py-20 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 flex flex-col items-center gap-3 shadow-lg">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-3xl">💬</div>
              <h3 className="text-base font-extrabold text-slate-900">لا توجد محادثات نشطة حالياً</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                ستظهر محادثات الفنيين هنا بمجرد قبول عروض الأسعار وبدء تنفيذ الطلبات.
              </p>
            </div>
          ) : (
            activeOrdersWithTechnician.map((order) => {
              const unreadCount = unreadCounts[order.id] || 0;
              return (
                <div 
                  key={order.id} 
                  onClick={() => {
                    setSelectedChatOrder(order);
                    setCurrentView('chat_room');
                  }}
                  className="bg-white/95 backdrop-blur-md border border-slate-200 hover:border-purple-300 transition rounded-2xl p-5 flex items-center justify-between cursor-pointer shadow-md relative"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-bold text-base relative">
                      🛠️
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{order.acceptedTechnicianName || 'فني معتمد'}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">طلب صيانة: {order.serviceCategory || 'خدمة عامة'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-lg">
                        {unreadCount} رسائل جديدة
                      </span>
                    )}
                    <span className="bg-purple-50 text-purple-700 text-xs font-bold px-4 py-2 rounded-xl">
                      مراسلة ✉️
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 w-screen h-screen flex flex-col font-cairo bg-cover bg-center bg-no-repeat overflow-hidden" 
      style={{ backgroundImage: `url(${bgWaves})` }} 
      dir="rtl"
    >
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-md z-30 shrink-0 relative">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-purple-700 text-white rounded-2xl overflow-hidden flex items-center justify-center font-extrabold text-base shadow-md border-2 border-purple-200">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{firstLetter}</span>
            )}
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">مرحباً بك،</span>
            <h1 className="text-sm font-bold text-slate-900">أهلاً، {clientName}</h1>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          <img src={logo} alt="Orbix Logo" className="h-9 object-contain" />
        </div>

        <div>
          <button 
            onClick={async () => {
              try {
                await signOut(auth);
                localStorage.removeItem('orbix_current_step');
                localStorage.removeItem('orbix_client_view');
                localStorage.removeItem('orbix_selected_chat_order');
                window.location.reload();
              } catch (err) {
                console.error(err);
              }
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div 
            onClick={() => setCurrentView('new_order')}
            className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-6 rounded-3xl shadow-lg hover:shadow-xl transition cursor-pointer flex flex-col justify-between group"
          >
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
              ➕
            </div>
            <div>
              <h3 className="text-lg font-extrabold mb-1">طلب جديد</h3>
              <p className="text-purple-100 text-xs">أطلب فني صيانة أو خدمة جديدة لمنشأتك بسهولة.</p>
            </div>
          </div>

          <div 
            onClick={() => setCurrentView('my_offers')}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-purple-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center text-2xl mb-4">🏷️</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">عروضي</h3>
              <p className="text-slate-500 text-xs">استعراض عروض الأسعار المقدمة لطلباتك.</p>
            </div>
          </div>

          <div 
            onClick={() => setCurrentView('order_tracking')}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-purple-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-4">📍</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">تتبع الطلب</h3>
              <p className="text-slate-500 text-xs">تابع حالة طلباتك الحالية خطوة بخطوة.</p>
              <span className="inline-block mt-3 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                {orders.filter(o => o.status === 'pending' || o.status === 'in_progress').length} قيد المتابعة
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div 
            onClick={() => setCurrentView('transactions')}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-purple-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-4">📄</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">سجل المعاملات</h3>
              <p className="text-slate-500 text-xs">عرض الفواتير والمدفوعات السابقة.</p>
              <span className="inline-block mt-3 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                {orders.filter(o => o.status === 'closed').length} معاملة مكتملة
              </span>
            </div>
          </div>

          <div 
            onClick={() => setCurrentView('wallet')}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-purple-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-4">💳</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">المحفظة</h3>
              <p className="text-slate-500 text-xs">رصيدك الحالي وشحن المحفظة.</p>
            </div>
          </div>

          <div 
            onClick={() => setCurrentView('notifications')}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-purple-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl mb-4">🔔</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">الإشعارات</h3>
              <p className="text-slate-500 text-xs">التنبيهات والرسائل الواردة.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-6">
          {/* كارد الرسائل مع عداد الرسائل غير المقروءة */}
          <div 
            onClick={() => setCurrentView('messages')}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-purple-300 transition cursor-pointer flex flex-col justify-between relative"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">💬</div>
              {totalUnreadMessages > 0 && (
                <span className="bg-rose-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md animate-pulse">
                  {totalUnreadMessages} رسائل جديدة
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">الرسائل</h3>
              <p className="text-slate-500 text-xs">تواصل مباشرة مع الفنيين وشركات الصيانة والدعم.</p>
            </div>
          </div>

          <div 
            onClick={() => setCurrentView('settings')}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-purple-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center text-2xl mb-4">⚙️</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">إعدادات الحساب</h3>
              <p className="text-slate-500 text-xs">تعديل البيانات الشخصية وكلمة المرور.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}