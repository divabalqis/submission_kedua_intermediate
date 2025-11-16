import '../styles/styles.css'; 
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import routes from './routes/routes.js';
import { getActiveRoute } from './routes/url-parser.js';
import { subscribeUserToPush } from './utils/push-subscribe.js';
import { unsubscribeUserFromPush } from './utils/push-unsubscribe.js';
import App from './pages/app.js';

// Elemen utama
const mainContent = document.querySelector('#main-content');
const navList = document.querySelector('.nav-list');
const drawerButton = document.querySelector('#drawer-button');
const navDrawer = document.querySelector('#navigation-drawer');
const profileName = document.querySelector('#profile-name');

// ===== Popup Utility =====
export function showPopup(message, type = 'info') {
  const popup = document.getElementById('popup');
  const messageEl = document.getElementById('popup-message');
  if (!popup || !messageEl) {
    const p = document.createElement('div');
    p.className = `popup show ${type}`;
    p.textContent = message;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3000);
    return;
  }
  messageEl.textContent = message;
  popup.className = `popup show ${type}`;
  setTimeout(() => popup.classList.remove('show'), 3000);
}

// ===== Router Halaman =====
const app = new App({ content: mainContent });
async function renderPage() { await app.renderPage(); }

// ===== Navbar Dinamis =====
function updateNavbar() {
  const token = localStorage.getItem('token');
  const name = localStorage.getItem('name');

  if (token) {
    navList.innerHTML = `
      <li><a href="#/">Beranda</a></li>
      <li><a href="#/add-story">Tambah Story</a></li>
      <li><a href="#/favorite">❤️ Favorit</a></li>
      <li><a href="#" id="logout-btn">Logout</a></li>
    `;
    profileName.textContent = name || '';
  } else {
    navList.innerHTML = `
      <li><a href="#/">Beranda</a></li>
      <li><a href="#/login">Login</a></li>
      <li><a href="#/register">Register</a></li>
    `;
    profileName.textContent = '';
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('name');
      showPopup('Berhasil logout', 'info');
      updateNavbar();
      renderPage();
      window.location.hash = '#/';
    });
  }
}

// ===== Drawer Mobile =====
drawerButton.addEventListener('click', () => navDrawer.classList.toggle('open'));
navList.addEventListener('click', () => navDrawer.classList.remove('open'));

// ===== PWA Buttons =====
function ensurePwaButtons() {
  let container = document.querySelector('.pwa-buttons');
  if (!container) {
    container = document.createElement('div');
    container.className = 'pwa-buttons';
    container.innerHTML = `
      <button id="install-btn" style="display:block; position:fixed; bottom:25px; left:25px;">📲 Install App</button>
      <button id="notify-btn" style="display:block; position:fixed; bottom:25px; left:110px;">🔕</button>
    `;
    document.body.appendChild(container);
  }
  return {
    installBtn: document.getElementById('install-btn'),
    notifyBtn: document.getElementById('notify-btn'),
  };
}

const { installBtn, notifyBtn } = ensurePwaButtons();

// ===== Service Worker + Offline =====
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const swUrl = `/sw.js`;
      const reg = await navigator.serviceWorker.register(swUrl);
      console.log('✅ Service Worker terdaftar:', reg.scope);
      console.log("SW URL:", swUrl);
      return reg;
    } catch (err) {
      console.error('❌ Gagal mendaftarkan Service Worker:', err);
      return null;
    }
  }
  return null;
}

// ===== Push Notification =====
let notifEnabled = localStorage.getItem('notifEnabled') === 'true';

function updateNotifButton() {
  if (!notifyBtn) return;
  notifyBtn.textContent = notifEnabled ? 'Subscribe🔔' : 'Unsubscribe🔕';
}

async function initPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const reg = await navigator.serviceWorker.ready;
  const token = localStorage.getItem('token');

  if (notifEnabled) {
    await subscribeUserToPush(reg, token);
  } else {
    await unsubscribeUserFromPush(reg, token);
  }
}


// Tombol notifikasi
if (notifyBtn) {
  notifyBtn.addEventListener('click', async () => {
    notifEnabled = !notifEnabled;
    localStorage.setItem('notifEnabled', notifEnabled);
    updateNotifButton();
    const reg = await navigator.serviceWorker.ready;
    const token = localStorage.getItem('token');
   if (notifEnabled && reg) {
  await subscribeUserToPush(reg, token);
  showPopup('Notifikasi diaktifkan', 'success');
  new Notification('Aktif!', { body: 'Kamu akan menerima cerita terbaru.', icon: '/icons/icon-192.png' });
} else {
  await unsubscribeUserFromPush(reg, token);
  showPopup('Notifikasi dinonaktifkan', 'info');
}

  });
  updateNotifButton();
}

// ===== PWA Install Prompt =====
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'block';
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      showPopup('Aplikasi berhasil diinstal 🎉', 'success');
      installBtn.style.display = 'none';
    } else showPopup('Instalasi dibatalkan', 'info');
    deferredPrompt = null;
  });
}

// ===== Event Listener =====
window.addEventListener('hashchange', () => { renderPage(); updateNavbar(); });
window.addEventListener('DOMContentLoaded', () => { updateNavbar(); renderPage(); console.log('✅ index.js berhasil dimuat!'); });

// ===== INIT =====
registerServiceWorker().then(initPush);
