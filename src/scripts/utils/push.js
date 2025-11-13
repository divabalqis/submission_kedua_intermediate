import CONFIG from '../config.js';
import { subscribeUserToPush } from './push-subscribe.js';

/**
 * Ubah base64 VAPID key ke Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Mendaftarkan service worker
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('✅ Service Worker terdaftar:', registration.scope);
      return registration;
    } catch (error) {
      console.error('❌ Gagal mendaftarkan Service Worker:', error);
      return null;
    }
  } else {
    console.warn('⚠️ Browser tidak mendukung Service Worker.');
    return null;
  }
}

/**
 * Subscribe ke Push Notification
 */
export async function subscribePush(registration, token) {
  try {
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
    });

    await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sub),
    });

    console.log('✅ Push Notification berhasil diaktifkan');
    return sub;
  } catch (err) {
    console.error('❌ Gagal subscribe ke Push Notification:', err);
    return null;
  }
}

/**
 * Unsubscribe Push Notification
 */
export async function unsubscribePush(registration, token) {
  try {
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
      console.log('🗑️ Push subscription dibatalkan.');
    }
  } catch (error) {
    console.error('❌ Gagal membatalkan push subscription:', error);
  }
}

/**
 * Inisialisasi Push Notification (dengan izin user)
 */
export const initPush = async (token) => {
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Browser tidak mendukung Service Worker.');
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    await subscribeUserToPush(registration, token);
    console.log('🔔 Notifikasi diaktifkan oleh pengguna.');
  } else {
    console.log('🚫 Izin notifikasi ditolak.');
  }
};
