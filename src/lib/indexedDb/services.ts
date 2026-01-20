'use client';

import { Service } from "@/data/services";

const DB_NAME = "fitnote-tracker";
const STORE_NAME = "fitnote-services";
const DB_VERSION = 1;

const isBrowserEnvironment = () =>
  typeof window !== "undefined" && typeof indexedDB !== "undefined";

const openDatabase = (): Promise<IDBDatabase> => {
  if (!isBrowserEnvironment()) {
    return Promise.reject(new Error("IndexedDB is only available in the browser."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const runStoreRequest = async <T>(
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = executor(store);

      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
};

const mapToService = (value: Service.Type | undefined): Service.Type | null =>
  value ? { ...value } : null;

const servicesDb = {
  async getAll(): Promise<Service.Type[]> {
    const result = await runStoreRequest<Service.Type[]>("readonly", (store) => store.getAll());
    return (result ?? []).map((service) => ({ ...service }));
  },

  async create(data: Omit<Service.Type, "id">): Promise<Service.Type> {
    const insertedId = await runStoreRequest<IDBValidKey>("readwrite", (store) => store.add(data));
    return { id: Number(insertedId), ...data };
  },

  async update(data: Service.Type): Promise<Service.Type | null> {
    if (typeof data.id !== "number") {
      throw new Error("An id is required to update a service record.");
    }
    await runStoreRequest("readwrite", (store) => store.put(data));
    return mapToService(data);
  },

  async remove(id: number): Promise<void> {
    await runStoreRequest("readwrite", (store) => store.delete(id));
  },
};

export default servicesDb;
