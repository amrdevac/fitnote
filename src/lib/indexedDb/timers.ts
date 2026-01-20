'use client';

import { ExerciseTimer } from "@/types/timer";
import { STORE_NAMES, runStoreRequest, runStoreTransaction } from "./base";

const timersDb = {
  async getTimers(): Promise<ExerciseTimer[]> {
    const rows = await runStoreRequest<ExerciseTimer[]>(
      STORE_NAMES.timers,
      "readonly",
      (store) => store.getAll()
    );
    return rows.map((timer) => ({ ...timer }));
  },

  async saveTimer(timer: ExerciseTimer) {
    await runStoreRequest(STORE_NAMES.timers, "readwrite", (store) => store.put(timer));
  },

  async deleteTimer(id: string) {
    await runStoreRequest(STORE_NAMES.timers, "readwrite", (store) => store.delete(id));
  },

  async replaceTimers(timers: ExerciseTimer[]) {
    await runStoreTransaction(STORE_NAMES.timers, "readwrite", (store) => {
      store.clear();
      timers.forEach((timer) => store.put(timer));
    });
  },
};

export default timersDb;
