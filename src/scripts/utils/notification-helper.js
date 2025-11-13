// src/utils/notification-helper.js
import { convertBase64ToUint8Array } from './index.js';
import { VAPID_PUBLIC_KEY } from '../config.js';
import { subscribePushNotification, unsubscribePushNotification } from '../data/api.js';

// Cek support notification API
export function isNotificationAvailable() {
  return 'Notification' in window;
}

// Cek permission granted
export function isNotificationGranted() {
  return Notification.permission === 'granted';
}

// Minta izin notifikasi
export async function requestNotificationPermission() {
  if (!isNotificationAvailable()) {
    console.error('Notification API unsupported.');
    return false;
  }

  if (isNotificationGranted()) return true;

  const status = await Notification.requestPermission();
  if (status !== 'granted') {
    alert('Izin notifikasi ditolak atau diabaikan.');
    return false;
  }

  return true;
}

// Dapatkan subscription saat ini
export async function getPushSubscription() {
  const registration = await navigator.serviceWorker.getRegistration();
  return registration?.pushManager?.getSubscription() || null;
}

// Cek apakah sudah subscribe
export async function isCurrentPushSubscriptionAvailable() {
  return !!(await getPushSubscription());
}

// Opsi untuk subscribe push manager
export function generateSubscribeOptions() {
  return {
    userVisibleOnly: true,
    applicationServerKey: convertBase64ToUint8Array(VAPID_PUBLIC_KEY),
  };
}

// Subscribe push notification
export async function subscribe() {
  if (!(await requestNotificationPermission())) return;

  if (await isCurrentPushSubscriptionAvailable()) {
    alert('Sudah berlangganan push notification.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const pushSubscription = await registration.pushManager.subscribe(generateSubscribeOptions());

    const { endpoint, keys } = pushSubscription.toJSON();
    const response = await subscribePushNotification({ endpoint, keys });

    if (!response.ok) {
      console.error('subscribe: response:', response);
      alert('Langganan push notification gagal diaktifkan.');
      await pushSubscription.unsubscribe(); // undo subscribe
      return;
    }

    alert('Langganan push notification berhasil diaktifkan.');
  } catch (error) {
    console.error('subscribe: error:', error);
    alert('Langganan push notification gagal diaktifkan.');
  }
}

// Unsubscribe push notification
export async function unsubscribe() {
  try {
    const pushSubscription = await getPushSubscription();
    if (!pushSubscription) {
      alert('Belum berlangganan push notification.');
      return;
    }

    const { endpoint, keys } = pushSubscription.toJSON();
    const response = await unsubscribePushNotification({ endpoint });

    if (!response.ok) {
      alert('Gagal memutus langganan push notification.');
      console.error('unsubscribe: response:', response);
      return;
    }

    const unsubscribed = await pushSubscription.unsubscribe();
    if (!unsubscribed) {
      alert('Gagal memutus langganan push notification.');
      await subscribePushNotification({ endpoint, keys }); // rollback
      return;
    }

    alert('Langganan push notification berhasil dinonaktifkan.');
  } catch (error) {
    alert('Gagal memutus langganan push notification.');
    console.error('unsubscribe: error:', error);
  }
}
