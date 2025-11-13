import { openDB } from 'idb';

const DB_NAME = 'mystory-db';
const STORE_NAME = 'favorites';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function saveFavorite(story) {
  const db = await getDB();
  await db.put(STORE_NAME, story);
  return story;
}

export async function getAllFavorites() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function deleteFavorite(id) {
  const db = await getDB();
  return db.delete(STORE_NAME, id);
}

export async function isFavorite(id) {
  const db = await getDB();
  const story = await db.get(STORE_NAME, id);
  return !!story;
}

export const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('sync-queue')) {
      db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
    }
  },
});