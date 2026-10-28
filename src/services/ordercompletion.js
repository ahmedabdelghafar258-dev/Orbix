import { doc, updateDoc, increment, collection, addDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * دالة معالجة إتمام الطلب والعمولات في الخلفية (Order/Transaction Script)
 * تقوم بحساب 2.5% عمولة العميل وتضاف للحساب الكلي، و2.5% عمولة الفني وتخصم من مستحقاته،
 * وتجمع الاثنين وتضيفهما لحساب أرباح الشركة في قاعدة البيانات.
 * 
 * @param {Object} orderData - بيانات الطلب
 * @param {string} orderData.orderId - رقم الطلب
 * @param {number} orderData.totalAmount - قيمة الخدمة الأساسية
 * @param {string} orderData.clientId - معرف العميل
 * @param {string} orderData.providerId - معرف الفني
 * @returns {Promise<Object>} - إرجاع الحسابات النهائية للتأكيد
 */
export async function processOrderCompletion({ orderId, totalAmount, clientId, providerId }) {
  const amountNum = parseFloat(totalAmount) || 0;

  if (amountNum <= 0) {
    throw new Error("مبلغ الطلب غير صالح.");
  }

  // 1. الحسابات الدقيقة للعمولات والخصومات
  const clientCommission = amountNum * 0.025; // 2.5% عمولة المنصة من العميل
  const providerCommission = amountNum * 0.025; // 2.5% عمولة المنصة من الفني
  
  const totalClientPayable = amountNum + clientCommission; // الحساب الكلي على العميل
  const netProviderPayout = amountNum - providerCommission;   // المستحق الصافي للفني
  const totalCompanyEarnings = clientCommission + providerCommission; // إجمالي أرباح الشركة (5%)

  try {
    // 2. تسجيل تفاصيل العملية وأرباح الشركة في جدول company_earnings
    await addDoc(collection(db, "company_earnings"), {
      orderId: orderId || "ORD_" + Date.now(),
      clientId: clientId || "unknown_client",
      providerId: providerId || "unknown_provider",
      baseOrderAmount: amountNum,
      clientCommission: clientCommission,     
      providerCommission: providerCommission, 
      netCompanyEarnings: totalCompanyEarnings, 
      totalClientPaid: totalClientPayable,
      providerPayout: netProviderPayout,
      status: "Completed",
      createdAt: new Date()
    });

    // 3. تحديث محفظة الشركة المركزية بإجمالي الـ 5% أوتوماتيكياً
    const companyWalletRef = doc(db, "platform_finances", "main_wallet");
    const walletSnap = await getDoc(companyWalletRef);

    if (walletSnap.exists()) {
      await updateDoc(companyWalletRef, {
        totalBalance: increment(totalCompanyEarnings),
        totalTransactionsCount: increment(1),
        lastUpdated: new Date()
      });
    } else {
      await setDoc(companyWalletRef, {
        totalBalance: totalCompanyEarnings,
        totalTransactionsCount: 1,
        lastUpdated: new Date()
      });
    }

    // 4. تحديث محفظة الفني وإضافة المبلغ الصافي له
    if (providerId) {
      const providerWalletRef = doc(db, "provider_wallets", providerId);
      const pWalletSnap = await getDoc(providerWalletRef);
      if (pWalletSnap.exists()) {
        await updateDoc(providerWalletRef, {
          pendingBalance: increment(netProviderPayout),
          lastUpdated: new Date()
        });
      } else {
        await setDoc(providerWalletRef, {
          pendingBalance: netProviderPayout,
          lastUpdated: new Date()
        });
      }
    }

    // 5. تحديث حالة الطلب الأساسي في قاعدة البيانات
    if (orderId) {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "Completed",
        totalClientPaid: totalClientPayable,
        providerPayout: netProviderPayout,
        companyEarnings: totalCompanyEarnings,
        completedAt: new Date()
      }).catch(() => {});
    }

    // إرجاع النتائج للتحقق أو الاستخدام في مكان آخر إن أردت
    return {
      success: true,
      totalClientPayable,
      netProviderPayout,
      totalCompanyEarnings
    };

  } catch (err) {
    console.error("Order Completion Logic Error:", err);
    throw new Error("فشل معالجة أمر إتمام الطلب: " + (err.message || "خطأ غير معروف"));
  }
}