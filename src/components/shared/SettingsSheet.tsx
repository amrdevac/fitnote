"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/ui/sheet";

type SettingsSheetProps = {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  contentClassName?: string;
  preventAutoFocus?: boolean;
};

const SettingsSheet = ({
  title,
  open,
  onOpenChange,
  children,
  contentClassName,
  preventAutoFocus = false,
}: SettingsSheetProps) => {
  useEffect(() => {
    if (!open || !preventAutoFocus) return;
    const id = window.setTimeout(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [open, preventAutoFocus]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={`rounded-t-3xl border-none bg-white px-6 pb-8 pt-6 text-slate-900 ${contentClassName ?? ""}`}
        onOpenAutoFocus={(event) => {
          if (preventAutoFocus) {
            event.preventDefault();
          }
        }}
      >
        <SheetHeader className="mb-4 px-0">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
