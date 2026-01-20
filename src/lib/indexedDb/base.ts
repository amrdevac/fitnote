'use client';

const DB_NAME = "fitnote-tracker";
const DB_VERSION = 4;

export const STORE_NAMES = {
  services: "fitnote-services",
  sessions: "fitnote-sessions",
  movements: "fitnote-movements",
  preferences: "fitnote-preferences",
  timers: "fitnote-timers",
} as const;

export type FitnoteStore = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];

const isBrowser = () => typeof window !== "undefined" && typeof indexedDB !== "undefined";

export const openFitnoteDb = (): Promise<IDBDatabase> => {
  if (!isBrowser()) {
    return Promise.reject(new Error("IndexedDB is only available in the browser."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAMES.services)) {
        db.createObjectStore(STORE_NAMES.services, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.sessions)) {
        db.createObjectStore(STORE_NAMES.sessions, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.movements)) {
        db.createObjectStore(STORE_NAMES.movements, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.preferences)) {
        db.createObjectStore(STORE_NAMES.preferences, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.timers)) {
        db.createObjectStore(STORE_NAMES.timers, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const runStoreRequest = async <T>(
  storeName: FitnoteStore,
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openFitnoteDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = executor(store);

      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
};

export const runStoreTransaction = async (
  storeName: FitnoteStore,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore, transaction: IDBTransaction) => void
) => {
  const db = await openFitnoteDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      action(store, transaction);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
};
