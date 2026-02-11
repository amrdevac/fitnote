"use client";

import { Button } from "@/ui/button";

type SelectionModeBarProps = {
  selectedCount: number;
  isArchiving: boolean;
  onCancel: () => void;
  onArchive: () => void;
};

const SelectionModeBar = ({
  selectedCount,
  isArchiving,
  onCancel,
  onArchive,
}: SelectionModeBarProps) => {
  return (
    <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-slate-900 px-5 py-3 text-white shadow-lg">
      <div>
        <p className="text-sm font-semibold">{selectedCount} selected</p>
        <p className="text-[11px] text-slate-200">Tap another card to add/remove</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-slate-800"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="bg-white text-slate-900 hover:bg-slate-100"
          onClick={onArchive}
          disabled={isArchiving || selectedCount === 0}
        >
          Archive
        </Button>
      </div>
    </div>
  );
};

export default SelectionModeBar;
