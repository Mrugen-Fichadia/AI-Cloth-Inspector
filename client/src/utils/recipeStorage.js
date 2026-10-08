// High-capacity client storage using IndexedDB for recipes and large base64 image datasets
// Ensures images persist across page refreshes at least until the browser window is closed.

const DB_NAME = 'WabricStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'recipesStore';
const RECIPES_KEY = 'wabric_recipes_data';
const SESSION_ACTIVE_KEY = 'wabric_browser_session_active';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Save recipes array to IndexedDB and sync to server backup.
 * Survives page refreshes without any 5MB localStorage quota limit.
 */
export async function saveRecipesToStorage(recipes) {
  if (!Array.isArray(recipes)) return;

  try {
    sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
  } catch (e) {}

  // 1. Save to IndexedDB
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(recipes, RECIPES_KEY);
    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = rej;
    });
  } catch (err) {
    console.warn('Could not save recipes to IndexedDB:', err);
  }

  // 2. Also sync to server in background
  try {
    fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipes })
    }).catch(() => {});
  } catch (e) {}
}

/**
 * Load recipes array from IndexedDB, server fallback, or defaults.
 */
export async function loadRecipesFromStorage(defaultRecipes = []) {
  try {
    sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
  } catch (e) {}

  // 1. Try IndexedDB
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(RECIPES_KEY);
    const data = await new Promise((res, rej) => {
      request.onsuccess = () => res(request.result);
      request.onerror = () => rej(request.error);
    });

    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.debug('IndexedDB read error, checking server fallback:', err);
  }

  // 2. Try server /api/recipes
  try {
    const res = await fetch('/api/recipes');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.recipes) && json.recipes.length > 0) {
        // Cache into IndexedDB for next time
        saveRecipesToStorage(json.recipes);
        return json.recipes;
      }
    }
  } catch (e) {}

  // 3. Fallback to localStorage (if small enough)
  try {
    const local = localStorage.getItem('wabric_recipes');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        saveRecipesToStorage(parsed);
        return parsed;
      }
    }
  } catch (e) {}

  return defaultRecipes;
}
