"use client";

import type { WorkoutSet } from "@/types/workout";

const stagedSetColors = ["#E5EEFF", "#FFEAE3", "#E8FBEF", "#FFF7DA"];
const dotColors = ["#3b82f6", "#f43f5e", "#22c55e", "#f59e0b", "#94a3b8"];

type SetCardListProps = {
  sets: WorkoutSet[];
  variant?: "staged" | "history";
  onDelete?: (setId: string) => void;
  emptyLabel?: string;
  maxHeightClassName?: string;
};

export default function SetCardList({
  sets,
  variant = "staged",
  onDelete,
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

  return (
    <div className={`space-y-3 overflow-auto ${maxHeightClassName}`}>
      {sets.map((set, index) => {
        const color = stagedSetColors[index % stagedSetColors.length];
        const dotColor = dotColors[index % dotColors.length];
        return (
          <div
            key={set.id}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-[0_6px_16px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="text-base font-semibold text-slate-900">{set.weight}</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">kg</span>
                <span className="text-slate-300">•</span>
                <span className="text-base font-semibold text-slate-900">{set.reps}</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">reps</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {set.rest} sec
              </span>
              {isStaged && (
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
