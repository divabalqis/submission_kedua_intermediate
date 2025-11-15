import CONFIG from '../config.js';

/**
 * Subscribe user ke Push Notification
 * @param {ServiceWorkerRegistration} registration 
 * @param {string} token 
 * @returns {PushSubscription|null}
 */
export const unsubscribeUserFromPush = async (registration, token) => {
  if (!registration || !token) return false;

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      console.log("⚠️ Tidak ada subscription aktif");
      return false;
    }


    const endpoint = subscription.endpoint;


    const unsubscribed = await subscription.unsubscribe();
    console.log("❌ Push Subscription dihentikan:", unsubscribed);

   
    const res = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal menghapus subscription di server");
    }

    console.log("🗑️ Server: endpoint dihapus");
    return true;

  } catch (error) {
    console.error("❌ Error unsubscribe:", error);
    return false;
  }
};


