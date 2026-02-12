'use client';

import { STORE_NAMES, runStoreRequest } from "./base";

const PREFERENCES_KEY = "fitnote-config";

export type FitnotePreferences = {
  id?: string;
  showAddButton: boolean;
  focusInputOnOpen: boolean;
  focusWeightOnSelect: boolean;
  completedSetThreshold: number;
};

export const defaultPreferences: FitnotePreferences = {
  showAddButton: true,
  focusInputOnOpen: true,
  focusWeightOnSelect: false,
  completedSetThreshold: 5,
};

const preferencesDb = {
  async get(): Promise<FitnotePreferences> {
    const stored = await runStoreRequest<FitnotePreferences | undefined>(
      STORE_NAMES.preferences,
      "readonly",
      (store) => store.get(PREFERENCES_KEY)
    );
    if (!stored) {
      return defaultPreferences;
    }
    return { ...defaultPreferences, ...stored };
  },

  async save(preferences: FitnotePreferences) {
    await runStoreRequest(STORE_NAMES.preferences, "readwrite", (store) =>
      store.put({ ...defaultPreferences, ...preferences, id: PREFERENCES_KEY })
    );
  },
};

export default preferencesDb;
