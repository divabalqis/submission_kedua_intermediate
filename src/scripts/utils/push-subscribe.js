import CONFIG from '../config.js';

/**
 * Subscribe user ke Push Notification
 * @param {ServiceWorkerRegistration} registration 
 * @param {string} token 
 * @returns {PushSubscription|null}
 */
export const subscribeUserToPush = async (registration, token) => {
  if (!registration || !token) return null;
  try {
    // Cek apakah sudah ada subscription
    let existingSub = await registration.pushManager.getSubscription();
    if (!existingSub) {
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
      };
      existingSub = await registration.pushManager.subscribe(subscribeOptions);
    }

    // --- Hanya ambil endpoint dan keys ---
    const subData = {
      endpoint: existingSub.endpoint,
      keys: {
        p256dh: existingSub.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(existingSub.getKey('p256dh')))) : '',
        auth: existingSub.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(existingSub.getKey('auth')))) : ''
      }
    };

    // Kirim ke server Dicoding
    const res = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal subscribe server');
    }
    console.log(res);

    console.log('✅ Push Subscription berhasil:', existingSub);
    return existingSub;
  } catch (error) {
    console.error('❌ Gagal subscribe ke push notification:', error);
    return null;
  }
};

/**
 * Helper: konversi VAPID key base64 ke Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}
