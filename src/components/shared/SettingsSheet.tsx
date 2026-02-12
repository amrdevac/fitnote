"use client";

import { useEffect, useRef } from "react";
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
  const touchStartYRef = useRef<number | null>(null);
  const touchStartScrollRef = useRef(0);
  const touchLastYRef = useRef<number | null>(null);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartYRef.current = touch.clientY;
    touchLastYRef.current = touch.clientY;
    touchStartScrollRef.current = event.currentTarget.scrollTop;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchLastYRef.current = touch.clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartYRef.current === null || touchLastYRef.current === null) return;
    const deltaY = touchLastYRef.current - touchStartYRef.current;
    if (deltaY > 70 && touchStartScrollRef.current <= 0) {
      onOpenChange(false);
    }
    touchStartYRef.current = null;
    touchLastYRef.current = null;
    touchStartScrollRef.current = 0;
  };

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
        className={`h-[60vh] overflow-y-auto rounded-t-3xl border-none bg-white px-6  text-slate-900 pb-[calc(2rem+var(--bottom-nav-height,0px)+env(safe-area-inset-bottom))] ${contentClassName ?? ""}`}
        onOpenAutoFocus={(event) => {
          if (preventAutoFocus) {
            event.preventDefault();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <SheetHeader className="sticky top-0 z-10 -mx-6 mb-4 border-b border-slate-50 bg-white px-6 pb-4 ">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
