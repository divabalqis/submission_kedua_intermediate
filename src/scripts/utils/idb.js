// src/scripts/utils/idb.js

const DB_NAME = 'mystory-db';
const DB_VERSION = 1;
const SYNC_STORE = 'sync-queue';
const FAVORITE_STORE = 'favorites';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        db.createObjectStore(SYNC_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(FAVORITE_STORE)) {
        db.createObjectStore(FAVORITE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

// ----- Queue story for sync -----
export async function queueStoryForSync(story) {
  const db = await openDB();
  const tx = db.transaction(SYNC_STORE, 'readwrite');
  tx.objectStore(SYNC_STORE).add(story);
  return new Promise((res, rej) => { 
    tx.oncomplete = () => res(); 
    tx.onerror = () => rej(tx.error); 
  });
}

export async function getQueuedStories() {
  const db = await openDB();
  const tx = db.transaction(SYNC_STORE, 'readonly');
  const req = tx.objectStore(SYNC_STORE).getAll();
  return new Promise((res, rej) => { 
    req.onsuccess = () => res(req.result); 
    req.onerror = () => rej(req.error); 
  });
}

// ----- Favorites -----
export async function saveFavorite(story) {
  const db = await openDB();
  const tx = db.transaction(FAVORITE_STORE, 'readwrite');
  tx.objectStore(FAVORITE_STORE).put(story);
  return new Promise((res, rej) => { 
    tx.oncomplete = () => res(story); 
    tx.onerror = () => rej(tx.error); 
  });
}

export async function deleteFavorite(id) {
  const db = await openDB();
  const tx = db.transaction(FAVORITE_STORE, 'readwrite');
  tx.objectStore(FAVORITE_STORE).delete(id);
  return new Promise((res, rej) => { 
    tx.oncomplete = () => res(); 
    tx.onerror = () => rej(tx.error); 
  });
}

export async function getAllFavorites() {
  const db = await openDB();
  const tx = db.transaction(FAVORITE_STORE, 'readonly');
  const req = tx.objectStore(FAVORITE_STORE).getAll();
  return new Promise((res, rej) => { 
    req.onsuccess = () => res(req.result); 
    req.onerror = () => rej(req.error); 
  });
}

export async function isFavorite(id) {
  const db = await openDB();
  const tx = db.transaction(FAVORITE_STORE, 'readonly');
  const req = tx.objectStore(FAVORITE_STORE).get(id);
  return new Promise((res, rej) => { 
    req.onsuccess = () => res(!!req.result); 
    req.onerror = () => rej(req.error); 
  });
}

// ----- Background sync for offline story -----
export async function registerSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-new-stories');
      console.log('Background sync registered!');
    } catch (err) {
      console.error('Gagal register sync:', err);
    }
  } else {
    console.log('Background sync tidak didukung browser ini.');
  }
}

export default openDB;
