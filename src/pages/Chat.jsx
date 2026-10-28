import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  addDoc,
  onSnapshot,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import bgWaves from '../assets/bg-waves.png';

export default function Chat({
  orderId,
  recipientId,
  recipientName,
  recipientImage,
  userImage,
  onBack
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // حالة اتصال الطرف الآخر الفعلي داخل التطبيق
  const [isRecipientActive, setIsRecipientActive] = useState(false);

  // 1. تحديث نشاط المستخدم الحالي (Heartbeat) كل 10 ثوانٍ طالما هو فاتح شاشة الشات
  useEffect(() => {
    if (!auth.currentUser || !recipientId) return;

    const userStatusRef = doc(db, 'users_presence', auth.currentUser.uid);

    // تحديث فوري عند فتح الشات
    const updateActiveStatus = async () => {
      try {
        await setDoc(userStatusRef, {
          lastActive: serverTimestamp(),
          isOnline: true
        }, { merge: true });
      } catch (err) {
        console.error("Error updating presence:", err);
      }
    };

    updateActiveStatus();

    // تحديث دوري كل 10 ثوانٍ لضمان بقاء الحالة خضراء طالما التطبيق مفتوح
    const interval = setInterval(() => {
      updateActiveStatus();
    }, 10000);

    // عند خروج المستخدم من الشات، نلغي حالته النشطة فوراً
    return () => {
      clearInterval(interval);
      setDoc(userStatusRef, {
        lastActive: null,
        isOnline: false
      }, { merge: true }).catch(() => {});
    };
  }, [recipientId]);

  // 2. مراقبة حالة نشاط الطرف الآخر (recipientId) لحظياً
  useEffect(() => {
    if (!recipientId) return;

    const recipientStatusRef = doc(db, 'users_presence', recipientId);

    const unsubscribePresence = onSnapshot(recipientStatusRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data && data.lastActive && data.isOnline) {
          // التحقق من أن آخر نشاط كان خلال الـ 20 ثانية الأخيرة (يعني فاتح الأب فعلاً)
          const lastActiveTime = data.lastActive.toMillis ? data.lastActive.toMillis() : new Date(data.lastActive).getTime();
          const now = Date.now();
          
          if (now - lastActiveTime < 25000) {
            setIsRecipientActive(true);
          } else {
            setIsRecipientActive(false);
          }
        } else {
          setIsRecipientActive(false);
        }
      } else {
        setIsRecipientActive(false);
      }
    });

    // فحص دوري كل 5 ثوانٍ لتحديث الحالة لو الطرف الآخر قفل فجأة بدون ما يضغط زر الخروج
    const checkInterval = setInterval(() => {
      onSnapshot(recipientStatusRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data && data.lastActive && data.isOnline) {
            const lastActiveTime = data.lastActive.toMillis ? data.lastActive.toMillis() : new Date(data.lastActive).getTime();
            if (Date.now() - lastActiveTime < 25000) {
              setIsRecipientActive(true);
              return;
            }
          }
        }
        setIsRecipientActive(false);
      });
    }, 5000);

    return () => {
      unsubscribePresence();
      clearInterval(checkInterval);
    };
  }, [recipientId]);

  // جلب الرسائل وتحديث حالة القراءة (read: true) فور فتح المحادثة لتختفي العلامة الحمراء
  useEffect(() => {
    if (!orderId || !auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders', orderId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((document) => {
          const data = document.data();
          if (data.senderId !== auth.currentUser.uid && data.read === false) {
            updateDoc(doc(db, 'orders', orderId, 'messages', document.id), {
              read: true
            }).catch(err => console.error("Error marking message as read:", err));
          }
          return {
            id: document.id,
            ...data
          };
        });

        setMessages(msgs);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading messages:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !auth.currentUser || !orderId) {
      return;
    }

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'orders', orderId, 'messages'), {
        text: text,
        senderId: auth.currentUser.uid,
        recipientId: recipientId,
        senderRole: 'client',
        senderImage: userImage || '',
        createdAt: serverTimestamp(),
        read: false
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(text);
      alert('حدث خطأ أثناء إرسال الرسالة.');
    }
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 font-cairo bg-cover bg-center bg-no-repeat overflow-hidden page-transition"
      style={{ backgroundImage: `url(${bgWaves})` }}
      dir="rtl"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-2xl w-full h-[85vh] p-6 shadow-2xl border border-slate-100 flex flex-col relative overflow-hidden">

        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 overflow-hidden border border-purple-200 flex items-center justify-center shrink-0">
              {recipientImage ? (
                <img
                  src={recipientImage}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-purple-700">
                  {recipientName?.charAt(0) || '👤'}
                </span>
              )}
            </div>

            <div>
              {/* اسم الطرف الآخر بخط عريض وبارز */}
              <h3 className="text-sm font-extrabold text-slate-900">
                {recipientName || 'مستخدم Orbix'}
              </h3>
              {isRecipientActive ? (
                <span className="text-[10px] text-emerald-600 font-bold block">
                  متصل الآن 🟢
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-bold block">
                  غير متصل
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <span>←</span>
            <span>العودة إلى الصفحة الرئيسية</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-2">
          {loading ? (
            <div className="text-center py-16 text-slate-500 text-xs font-bold">
              جاري تحميل الرسائل...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs italic">
              لا توجد رسائل سابقة. ابدأ المحادثة الآن بخصوص طلب الصيانة!
            </div>
          ) : (
            messages.map((msg) => {
              const isMyMessage =
                msg.senderId === auth.currentUser?.uid;

              const currentMsgImage = isMyMessage
                ? (userImage || msg.senderImage)
                : (recipientImage || msg.senderImage);

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 max-w-[75%] ${
                    isMyMessage
                      ? 'self-end flex-row-reverse'
                      : 'self-start flex-row'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 overflow-hidden border border-purple-200 flex items-center justify-center shrink-0 mb-1">
                    {currentMsgImage ? (
                      <img
                        src={currentMsgImage}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-purple-700">👤</span>
                    )}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isMyMessage
                        ? 'bg-purple-700 text-white rounded-bl-none'
                        : 'bg-slate-100 text-slate-800 rounded-br-none border border-slate-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={handleSendMessage}
          className="pt-3 border-t border-slate-200 flex items-center gap-2 mt-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
            required
          />

          <button
            type="submit"
            className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-6 py-3 rounded-xl transition cursor-pointer shadow-md shrink-0"
          >
            إرسال ✉️
          </button>
        </form>

      </div>
    </div>
  );
}