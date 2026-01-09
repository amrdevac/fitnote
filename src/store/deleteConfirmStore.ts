import { create } from "zustand";

interface DeleteConfirmState {
  entryIds: number[];
  open: boolean;
  pending: boolean;
  message: string;
  openConfirm: (entryIds: number[], message?: string) => void;
  closeConfirm: () => void;
  setPending: (value: boolean) => void;
}

export const useDeleteConfirmStore = create<DeleteConfirmState>((set) => ({
  entryIds: [],
  open: false,
  pending: false,
  message: "Catatan akan hilang permanen dari timeline.",
  openConfirm: (entryIds, message = "Catatan akan hilang permanen dari timeline.") =>
    set({ entryIds, open: true, message }),
  closeConfirm: () => set({ open: false, entryIds: [], pending: false }),
  setPending: (value) => set({ pending: value }),
}));
