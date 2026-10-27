import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import TechnicianAccountSettings from './TechnicianAccountSettings'; // ⚙️ تم استيراد إعدادات حساب الفني المستقلة
import AvailableOrders from './AvailableOrders';
import TechnicianOrderTracking from './TechnicianOrderTracking';
import TechnicianTransactions from './TechnicianTransactions';
import TechnicianChats from './TechnicianChats';
import TechnicianWallet from './TechnicianWallet';
import bgWaves from '../assets/bg-waves.png'; 
import logo from '../assets/logo.png';

export default function TechnicianDashboard({ userData: initialUserData }) {
  const [userData, setUserData] = useState(initialUserData);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orders, setOrders] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('orbix_tech_view') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('orbix_tech_view', currentView);
  }, [currentView]);

  const fetchTechOrders = async () => {
    if (!auth.currentUser) return;
    try {
      setLoadingOrders(true);
      const techId = auth.currentUser.uid;
      let q = query(collection(db, "orders"), where("acceptedTechnicianId", "==", techId));
      const querySnapshot = await getDocs(q);
      let userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (userOrders.length === 0) {
        const qAlt = query(collection(db, "orders"), where("techId", "==", techId));
        const snapAlt = await getDocs(qAlt);
        userOrders = snapAlt.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      setOrders(userOrders);
    } catch (error) {
      console.error("Error fetching technician orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchTechOrders();
  }, []);

  // عداد الرسائل غير المقروءة للفني
  useEffect(() => {
    if (!auth.currentUser) return;
    if (orders.length === 0) return;

    const unsubs = orders.map(order => {
      const q = query(collection(db, 'orders', order.id, 'messages'));
      return onSnapshot(q, (snapshot) => {
        let unread = 0;
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
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

  const totalUnreadMessages = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const techName = userData?.fullName || 'فني Orbix';
  const firstLetter = techName.charAt(0);
  const profileImage = userData?.profileimage || userData?.profileImage || '';

  if (currentView === 'available_orders') {
    return (
      <AvailableOrders 
        userData={userData} 
        onBack={() => { 
          setCurrentView('dashboard'); 
          localStorage.setItem('orbix_tech_view', 'dashboard');
          fetchTechOrders(); 
        }} 
      />
    );
  }

  if (currentView === 'order_tracking') {
    return (
      <TechnicianOrderTracking 
        userData={userData} 
        onBack={() => { 
          setCurrentView('dashboard'); 
          localStorage.setItem('orbix_tech_view', 'dashboard');
          fetchTechOrders(); 
        }} 
      />
    );
  }

  if (currentView === 'transactions') {
    return (
      <TechnicianTransactions 
        onBack={() => { 
          setCurrentView('dashboard'); 
          localStorage.setItem('orbix_tech_view', 'dashboard');
          fetchTechOrders(); 
        }} 
      />
    );
  }

  if (currentView === 'wallet') {
    return (
      <TechnicianWallet 
        userData={userData} 
        onBack={() => { 
          setCurrentView('dashboard'); 
          localStorage.setItem('orbix_tech_view', 'dashboard');
          fetchTechOrders(); 
        }} 
      />
    );
  }

  if (currentView === 'messages') {
    return (
      <TechnicianChats 
        userData={userData} 
        onBack={() => { 
          setCurrentView('dashboard'); 
          localStorage.setItem('orbix_tech_view', 'dashboard');
          fetchTechOrders(); 
        }} 
      />
    );
  }

  // ربط زر الإعدادات بصفحة إعدادات الفني المستقلة
  if (currentView === 'settings') {
    return (
      <TechnicianAccountSettings 
        userData={userData} 
        onBack={() => { 
          setCurrentView('dashboard'); 
          localStorage.setItem('orbix_tech_view', 'dashboard');
          fetchTechOrders(); 
        }} 
        onUpdateUserData={(updatedData) => setUserData(updatedData)}
      />
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
          <div className="w-11 h-11 bg-indigo-700 text-white rounded-2xl overflow-hidden flex items-center justify-center font-extrabold text-base shadow-md border-2 border-indigo-200">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{firstLetter}</span>
            )}
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">مرحباً بك، فني معتمد</span>
            <h1 className="text-sm font-bold text-slate-900">{techName}</h1>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          <img src={logo} alt="Orbix Logo" className="h-9 object-contain" />
        </div>

        <div>
          <button 
            type="button"
            onClick={async () => {
              try {
                await signOut(auth);
                localStorage.removeItem('orbix_current_step');
                localStorage.removeItem('orbix_tech_view');
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
          <button 
            type="button"
            onClick={() => {
              localStorage.setItem('orbix_tech_view', 'available_orders');
              setCurrentView('available_orders');
            }}
            className="bg-gradient-to-br from-indigo-700 to-purple-800 text-white p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between group text-right w-full"
          >
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
              🛠️
            </div>
            <div>
              <h3 className="text-lg font-extrabold mb-1">الطلبات المتاحة</h3>
              <p className="text-indigo-100 text-xs">استعراض طلبات الصيانة الجديدة المتاحة للتقديم.</p>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setCurrentView('negotiations')}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-indigo-300 transition text-right w-full cursor-pointer flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center text-2xl mb-4">💬</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">مفاوضات</h3>
              <p className="text-slate-500 text-xs">إدارة عروض الأسعار والمفاوضات مع العملاء.</p>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => {
              localStorage.setItem('orbix_tech_view', 'order_tracking');
              setCurrentView('order_tracking');
            }}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-indigo-300 transition text-right w-full cursor-pointer flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-4">📍</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">تتبع الطلب</h3>
              <p className="text-slate-500 text-xs">متابعة حالة الطلبات قيد التنفيذ.</p>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <button 
            type="button"
            onClick={() => {
              localStorage.setItem('orbix_tech_view', 'transactions');
              setCurrentView('transactions');
            }}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-indigo-300 transition text-right w-full cursor-pointer flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-4">📄</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">سجل المعاملات</h3>
              <p className="text-slate-500 text-xs">عرض الطلبات والخدمات المكتملة.</p>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => {
              localStorage.setItem('orbix_tech_view', 'wallet');
              setCurrentView('wallet');
            }}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-indigo-300 transition text-right w-full cursor-pointer flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-4">💰</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">المحفظة والأرباح</h3>
              <p className="text-slate-500 text-xs">أرباحك الحالية وعمليات سحب الرصيد.</p>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setCurrentView('notifications')}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-indigo-300 transition text-right w-full cursor-pointer flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl mb-4">🔔</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">إشعارات</h3>
              <p className="text-slate-500 text-xs">التنبيهات وحالة العروض المقدمة.</p>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-6">
          <button 
            type="button"
            onClick={() => {
              localStorage.setItem('orbix_tech_view', 'messages');
              setCurrentView('messages');
            }}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-indigo-300 transition text-right w-full cursor-pointer flex flex-col justify-between relative"
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
              <h3 className="text-lg font-bold text-slate-900 mb-1">رسائل</h3>
              <p className="text-slate-500 text-xs">التواصل المباشر مع العملاء وصورهم الشخصية.</p>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => {
              localStorage.setItem('orbix_tech_view', 'settings');
              setCurrentView('settings');
            }}
            className="bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-lg hover:border-indigo-300 transition text-right w-full cursor-pointer flex flex-col justify-between"
          >
            <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center text-2xl mb-4">⚙️</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">إعدادات الحسابات</h3>
              <p className="text-slate-500 text-xs">تعديل بيانات الفني، الصورة الشخصية، وكلمة المرور.</p>
            </div>
          </button>
        </div>

      </main>
    </div>
  );
}