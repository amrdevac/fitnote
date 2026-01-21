"use client";

import { useEffect, useState } from "react";
import { movementOptions } from "@/data/workouts";
import { MovementOption, WorkoutMovement, WorkoutSession, WorkoutSet } from "@/types/workout";
import { getDefaultSessionTitle } from "@/lib/sessionTitle";
import workoutsDb from "@/lib/indexedDb/workout";

type WorkoutInputs = {
  weight: string;
  reps: string;
  rest: string;
};

type ActionResult<T = undefined> = {
  success: boolean;
  error?: string;
  data?: T;
};

const initialInputs: WorkoutInputs = {
  weight: "",
  reps: "",
  rest: "",
};

type BuilderDraft = {
  inputs: WorkoutInputs;
  currentMovementId: string;
  currentSets: WorkoutSet[];
  stagedMovements: WorkoutMovement[];
};

const uniqueId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const useWorkoutSession = () => {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [movementLibrary, setMovementLibrary] = useState(movementOptions);
  const [currentMovementId, setCurrentMovementId] = useState<string>("");
  const [inputs, setInputs] = useState<WorkoutInputs>(initialInputs);
  const [currentSets, setCurrentSets] = useState<WorkoutSet[]>([]);
  const [stagedMovements, setStagedMovements] = useState<WorkoutMovement[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const draftKey = "fitnote-builder-draft";

  const ensureSessionTitle = (session: WorkoutSession): WorkoutSession => {
    const normalizedTitle = session.title?.trim();
    if (normalizedTitle?.length) {
      if (normalizedTitle === session.title) {
        return session;
      }
      return { ...session, title: normalizedTitle };
    }
    return { ...session, title: getDefaultSessionTitle(session.createdAt) };
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    async function hydrateFromDb() {
      try {
        const [storedSessions, storedMovements] = await Promise.all([
          workoutsDb.getSessions(),
          workoutsDb.getMovementOptions(),
        ]);
        if (cancelled) return;

        const normalizedSessions = storedSessions.map((session) => ensureSessionTitle(session));
        setSessions(normalizedSessions);
        normalizedSessions.forEach((session, index) => {
          const original = storedSessions[index];
          if (!original) return;
          if (session.title !== original.title) {
            workoutsDb
              .saveSession(session)
              .catch((error) => console.error("Failed to backfill session title", error));
          }
        });
        const nextMovements: MovementOption[] = storedMovements.length
          ? storedMovements
          : movementOptions;
        if (!storedMovements.length) {
          await workoutsDb.replaceMovementLibrary(nextMovements);
        }

        let draft: BuilderDraft | null = null;
        if (typeof window !== "undefined") {
          const raw = window.localStorage.getItem(draftKey);
          if (raw) {
            try {
              draft = JSON.parse(raw) as BuilderDraft;
            } catch {
              draft = null;
            }
          }
        }

        if (cancelled) return;
        setMovementLibrary(nextMovements);

        const movementExists = (id: string) =>
          nextMovements.some((movement) => movement.id === id);
        const draftMovementId =
          draft?.currentMovementId && movementExists(draft.currentMovementId)
            ? draft.currentMovementId
            : nextMovements[0]?.id ?? "";

        setCurrentMovementId(draftMovementId);
        if (draft) {
          setInputs(draft.inputs ?? initialInputs);
          setCurrentSets(draft.currentSets ?? []);
          setStagedMovements(draft.stagedMovements ?? []);
        }
      } catch (error) {
        console.error("Failed to hydrate workout data from IndexedDB", error);
      } finally {
        if (!cancelled) {
          setIsInitialized(true);
        }
      }
    }
    hydrateFromDb();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isInitialized || typeof window === "undefined") return;
    const draft: BuilderDraft = {
      inputs,
      currentMovementId,
      currentSets,
      stagedMovements,
    };
    window.localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [inputs, currentMovementId, currentSets, stagedMovements, isInitialized]);

  function updateInput(field: keyof WorkoutInputs, value: string) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  function addSet(): ActionResult {
    const weight = Number.parseFloat(inputs.weight);
    const reps = Number.parseInt(inputs.reps, 10);
    const rest = Number.parseInt(inputs.rest, 10);
    if (!inputs.weight || Number.isNaN(weight) || weight <= 0) {
      return { success: false, error: "Isi bobot dengan angka valid." };
    }
    if (!inputs.reps || Number.isNaN(reps) || reps <= 0) {
      return { success: false, error: "Isi jumlah rep dengan angka valid." };
    }
    if (!inputs.rest || Number.isNaN(rest) || rest <= 0) {
      return { success: false, error: "Isi waktu istirahat dengan angka valid." };
    }
    const newSet: WorkoutSet = {
      id: uniqueId(),
      weight,
      reps,
      rest,
    };
    setCurrentSets((prev) => [...prev, newSet]);
    setInputs((prev) => ({ ...prev, weight: "", reps: "", rest: "" }));
    return { success: true };
  }

  function removeSet(id: string) {
    setCurrentSets((prev) => prev.filter((set) => set.id !== id));
  }

  function clearCurrentSets() {
    setCurrentSets([]);
    setInputs(initialInputs);
  }

  function saveMovement(): ActionResult {
    if (!currentMovementId) {
      return { success: false, error: "Pilih gerakan terlebih dahulu." };
    }
    if (!currentSets.length) {
      return { success: false, error: "Tambahkan minimal satu set." };
    }

    const movementName =
      movementLibrary.find((movement) => movement.id === currentMovementId)
        ?.name ?? "Gerakan kustom";

    const newMovement: WorkoutMovement = {
      id: uniqueId(),
      name: movementName,
      sets: currentSets,
    };

    setStagedMovements((prev) => [...prev, newMovement]);
    clearCurrentSets();
    return { success: true };
  }

  function removeMovement(id: string) {
    setStagedMovements((prev) => prev.filter((movement) => movement.id !== id));
  }

  async function saveSession(): Promise<ActionResult<WorkoutSession>> {
    if (!stagedMovements.length) {
      return { success: false, error: "Tambahkan minimal satu gerakan." };
    }
    const createdAt = new Date().toISOString();
    const newSession: WorkoutSession = {
      id: uniqueId(),
      createdAt,
      title: getDefaultSessionTitle(createdAt),
      movements: stagedMovements,
    };
    try {
      const next = [newSession, ...sessions];
      await workoutsDb.saveSession(newSession);
      setSessions(next);
      setStagedMovements([]);
      clearCurrentSets();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(draftKey);
      }
      return { success: true, data: newSession };
    } catch (error) {
      console.error("Failed to persist sessions", error);
      return { success: false, error: "Gagal menyimpan ke IndexedDB." };
    }
  }

  async function archiveSessions(ids: string[]) {
    if (!ids.length) return;
    const now = new Date().toISOString();
    const idSet = new Set(ids);
    const nextSessions = sessions.map((session) =>
      idSet.has(session.id) && !session.archivedAt
        ? { ...session, archivedAt: now }
        : session
    );
    setSessions(nextSessions);
    try {
      await workoutsDb.replaceSessions(nextSessions);
    } catch (error) {
      console.error("Failed to archive sessions", error);
      setSessions(sessions);
    }
  }

  async function renameSession(sessionId: string, nextTitle: string): Promise<ActionResult> {
    const targetSession = sessions.find((session) => session.id === sessionId);
    if (!targetSession) {
      return { success: false, error: "Sesi tidak ditemukan." };
    }
    const trimmed = nextTitle.trim();
    const normalized = trimmed.length ? trimmed : getDefaultSessionTitle(targetSession.createdAt);
    if (targetSession.title === normalized) {
      return { success: true };
    }
    const updatedSession: WorkoutSession = { ...targetSession, title: normalized };
    const previousSessions = sessions;
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? updatedSession : session))
    );
    try {
      await workoutsDb.saveSession(updatedSession);
      return { success: true, data: updatedSession };
    } catch (error) {
      console.error("Failed to rename session", error);
      setSessions(previousSessions);
      return { success: false, error: "Gagal menyimpan judul sesi." };
    }
  }

  function resetBuilder() {
    clearCurrentSets();
    setStagedMovements([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(draftKey);
    }
  }

  function addCustomMovement(name: string): ActionResult<MovementOption> {
    const trimmed = name.trim();
    if (!trimmed.length) {
      return { success: false, error: "Nama gerakan wajib diisi." };
    }
    const existing = movementLibrary.find(
      (movement) => movement.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      return { success: true, data: existing };
    }
    const customMovement: MovementOption = {
      id: uniqueId(),
      name: trimmed,
      description: "Gerakan kustom",
    };
    setMovementLibrary((prev) => {
      const next = [...prev, customMovement];
      workoutsDb
        .replaceMovementLibrary(next)
        .catch((error) => console.error("Failed to persist movement library", error));
      return next;
    });
    return { success: true, data: customMovement };
  }

  return {
    sessions,
    movementLibrary,
    currentMovementId,
    setCurrentMovementId,
    inputs,
    updateInput,
    currentSets,
    stagedMovements,
    addSet,
    removeSet,
    clearCurrentSets,
    saveMovement,
    removeMovement,
    saveSession,
    resetBuilder,
    addCustomMovement,
    isInitialized,
    archiveSessions,
    renameSession,
  };
};

export default useWorkoutSession;
