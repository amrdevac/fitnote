import { create } from "zustand";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { WorkoutSession } from "@/types/workout";

const selectionDelayMs = 350;

export type MobileWorkoutHomeStore = {
  sessions: WorkoutSession[];
  visibleSessions: WorkoutSession[];
  totalMovements: number;
  setSessions: (sessions: WorkoutSession[]) => void;

  expandedSessions: Set<string>;
  scrollTargetSession: string | null;
  toggleSession: (sessionId: string) => void;
  clearScrollTarget: () => void;

  selectedSessions: Set<string>;
  isSelectionMode: boolean;
  selectionTimerId: ReturnType<typeof setTimeout> | null;
  selectionTriggered: boolean;
  clearSelectionTimer: () => void;
  enterSelectionMode: (sessionId: string) => void;
  tryStartSelection: (sessionId: string) => void;
  handleCardPointerDown: (
    sessionId: string,
    event: ReactPointerEvent<HTMLDivElement>
  ) => void;
  handleCardPointerUp: () => void;
  handleCardPointerLeave: () => void;
  toggleSessionSelection: (sessionId: string) => void;
  exitSelectionMode: () => void;

  editingSessionId: string | null;
  editingTitle: string;
  isRenamingTitle: boolean;
  startEditingTitle: (sessionId: string, currentTitle: string) => void;
  setEditingTitle: (title: string) => void;
  finishEditingTitleState: () => void;
  commitEditingTitle: () => Promise<boolean>;
  renameSession:
    | ((sessionId: string, title: string) => Promise<{ success: boolean }>)
    | null;
  setRenameSession: (
    renameSession:
      | ((sessionId: string, title: string) => Promise<{ success: boolean }>)
      | null
  ) => void;
};

export const useMobileWorkoutHomeStore = create<MobileWorkoutHomeStore>((set, get) => ({
  sessions: [],
  visibleSessions: [],
  totalMovements: 0,
  setSessions: (sessions) => {
    const visibleSessions = sessions.filter((session) => !session.archivedAt);
    const totalMovements = visibleSessions.reduce(
      (acc, session) => acc + session.movements.length,
      0
    );
    set((state) => {
      if (state.selectedSessions.size === 0) {
        return {
          sessions,
          visibleSessions,
          totalMovements,
          isSelectionMode: false,
        };
      }
      const visibleIds = new Set(visibleSessions.map((session) => session.id));
      const nextSelected = new Set(
        [...state.selectedSessions].filter((id) => visibleIds.has(id))
      );
      return {
        sessions,
        visibleSessions,
        totalMovements,
        selectedSessions: nextSelected,
        isSelectionMode: nextSelected.size > 0 ? state.isSelectionMode : false,
      };
    });
  },

  expandedSessions: new Set(),
  scrollTargetSession: null,
  toggleSession: (sessionId) => {
    set((state) => {
      const next = new Set(state.expandedSessions);
      let willExpand = false;
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
        willExpand = true;
      }
      return {
        expandedSessions: next,
        scrollTargetSession: willExpand ? sessionId : state.scrollTargetSession,
      };
    });
  },
  clearScrollTarget: () => set({ scrollTargetSession: null }),

  selectedSessions: new Set(),
  isSelectionMode: false,
  selectionTimerId: null,
  selectionTriggered: false,
  clearSelectionTimer: () => {
    const timerId = get().selectionTimerId;
    if (timerId) {
      clearTimeout(timerId);
    }
    set({ selectionTimerId: null, selectionTriggered: false });
  },
  enterSelectionMode: (sessionId) => {
    set({
      isSelectionMode: true,
      selectedSessions: new Set([sessionId]),
    });
  },
  tryStartSelection: (sessionId) => {
    if (get().isSelectionMode) return;
    get().clearSelectionTimer();
    const timerId = setTimeout(() => {
      set({
        selectionTriggered: true,
        selectionTimerId: null,
        isSelectionMode: true,
        selectedSessions: new Set([sessionId]),
      });
    }, selectionDelayMs);
    set({ selectionTimerId: timerId });
  },
  handleCardPointerDown: (sessionId, event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    get().tryStartSelection(sessionId);
  },
  handleCardPointerUp: () => {
    if (get().selectionTimerId) {
      get().clearSelectionTimer();
      return;
    }
    if (get().selectionTriggered) {
      set({ selectionTriggered: false });
    }
  },
  handleCardPointerLeave: () => {
    if (get().selectionTimerId) {
      get().clearSelectionTimer();
    }
    if (get().selectionTriggered) {
      set({ selectionTriggered: false });
    }
  },
  toggleSessionSelection: (sessionId) => {
    set((state) => {
      const next = new Set(state.selectedSessions);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return {
        selectedSessions: next,
        isSelectionMode: next.size > 0,
      };
    });
  },
  exitSelectionMode: () => {
    get().clearSelectionTimer();
    set({
      isSelectionMode: false,
      selectedSessions: new Set(),
      selectionTriggered: false,
    });
  },

  editingSessionId: null,
  editingTitle: "",
  isRenamingTitle: false,
  startEditingTitle: (sessionId, currentTitle) => {
    if (get().isSelectionMode) return;
    set({
      editingSessionId: sessionId,
      editingTitle: currentTitle,
    });
  },
  setEditingTitle: (title) => set({ editingTitle: title }),
  finishEditingTitleState: () =>
    set({
      editingSessionId: null,
      editingTitle: "",
      isRenamingTitle: false,
    }),
  commitEditingTitle: async () => {
    const { editingSessionId, editingTitle, isRenamingTitle, renameSession } = get();
    if (!editingSessionId || isRenamingTitle || !renameSession) return false;
    set({ isRenamingTitle: true });
    const result = await renameSession(editingSessionId, editingTitle);
    if (result.success) {
      get().finishEditingTitleState();
      return true;
    }
    set({ isRenamingTitle: false });
    return false;
  },
  renameSession: null,
  setRenameSession: (renameSession) => set({ renameSession }),
}));
