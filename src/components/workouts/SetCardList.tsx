"use client";

import { useMemo, useState } from "react";
import type { WorkoutSet } from "@/types/workout";

const stagedSetColors = ["#E5EEFF", "#FFEAE3", "#E8FBEF", "#FFF7DA"];
const dotColors = ["#3b82f6", "#f43f5e", "#22c55e", "#f59e0b", "#94a3b8"];

type SetCardListProps = {
  sets: WorkoutSet[];
  variant?: "staged" | "history";
  onDelete?: (setId: string) => void;
  onEditSet?: (setId: string, updates: Partial<Pick<WorkoutSet, "weight" | "reps" | "rest">>) => void;
  emptyLabel?: string;
  maxHeightClassName?: string;
};

export default function SetCardList({
  sets,
  variant = "staged",
  onDelete,
  onEditSet,
  emptyLabel = "No sets yet.",
  maxHeightClassName = "max-h-40",
}: SetCardListProps) {
  if (sets.length === 0) {
    return (
      <p className="rounded-md bg-slate-50 px-4 py-3 text-xs text-slate-400">
        {emptyLabel}
      </p>
    );
  }

  const isStaged = variant === "staged";
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ weight: string; reps: string; rest: string }>({
    weight: "",
    reps: "",
    rest: "",
  });

  const editingSet = useMemo(
    () => (editingSetId ? sets.find((set) => set.id === editingSetId) ?? null : null),
    [editingSetId, sets]
  );

  const beginEdit = (set: WorkoutSet) => {
    if (!isStaged || !onEditSet) return;
    setEditingSetId(set.id);
    setDraft({
      weight: String(set.weight),
      reps: String(set.reps),
      rest: String(set.rest),
    });
  };

  const commitEdit = () => {
    if (!editingSet || !onEditSet) {
      setEditingSetId(null);
      return;
    }
    const weight = Number.parseFloat(draft.weight);
    const reps = Number.parseInt(draft.reps, 10);
    const rest = Number.parseInt(draft.rest, 10);
    if (!Number.isNaN(weight) && weight > 0) {
      onEditSet(editingSet.id, { weight });
    }
    if (!Number.isNaN(reps) && reps > 0) {
      onEditSet(editingSet.id, { reps });
    }
    if (!Number.isNaN(rest) && rest > 0) {
      onEditSet(editingSet.id, { rest });
    }
    setEditingSetId(null);
  };

  const cancelEdit = () => {
    setEditingSetId(null);
  };

  const handleBlurCommit = (setId: string) => {
    if (typeof document === "undefined") {
      commitEdit();
      return;
    }
    setTimeout(() => {
      const active = document.activeElement as HTMLElement | null;
      if (active?.getAttribute("data-editing-set-id") === setId) return;
      commitEdit();
    }, 0);
  };


  return (
    <div className={`space-y-3 overflow-auto ${maxHeightClassName}`}>
      {sets.map((set, index) => {
        const color = stagedSetColors[index % stagedSetColors.length];
        const dotColor = dotColors[index % dotColors.length];
        const isEditing = editingSetId === set.id;
        return (
          <div
            key={set.id}
            className={`flex items-center rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-[0_6px_16px_rgba(15,23,42,0.05)] ${
              isEditing ? "gap-3" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                {isEditing ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">kg</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={draft.weight}
                        onChange={(event) =>
                          setDraft((prev) => ({ ...prev, weight: event.target.value }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") commitEdit();
                          if (event.key === "Escape") cancelEdit();
                        }}
                        data-editing-set-id={set.id}
                        onBlur={() => handleBlurCommit(set.id)}
                        className="h-7 w-12 rounded-md border border-slate-200 px-1 text-sm font-semibold text-slate-900"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">reps</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={draft.reps}
                        onChange={(event) =>
                          setDraft((prev) => ({ ...prev, reps: event.target.value }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") commitEdit();
                          if (event.key === "Escape") cancelEdit();
                        }}
                        data-editing-set-id={set.id}
                        onBlur={() => handleBlurCommit(set.id)}
                        className="h-7 w-10 rounded-md border border-slate-200 px-1 text-sm font-semibold text-slate-900"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onDoubleClick={() => beginEdit(set)}
                      className="text-base font-semibold text-slate-900"
                    >
                      {set.weight}
                    </button>
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">kg</span>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onDoubleClick={() => beginEdit(set)}
                      className="text-base font-semibold text-slate-900"
                    >
                      {set.reps}
                    </button>
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">reps</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <div className="flex flex-col gap-1 ">
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">sec</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={draft.rest}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, rest: event.target.value }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitEdit();
                      if (event.key === "Escape") cancelEdit();
                    }}
                    data-editing-set-id={set.id}
                    onBlur={() => handleBlurCommit(set.id)}
                    className="h-7 w-12 rounded-md border border-slate-200 px-1 text-sm font-semibold text-slate-900 "
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onDoubleClick={() => beginEdit(set)}
                  className="text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                >
                  {set.rest} sec
                </button>
              )}
              {isStaged && !isEditing && (
                <button
                  type="button"
                  className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600"
                  onClick={() => onDelete?.(set.id)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
