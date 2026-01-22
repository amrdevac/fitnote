"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

type SwipeNavigationProps = {
  leftRoute?: string;
  rightRoute?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  children: React.ReactNode;
};

const swipeThreshold = 80;
const swipeIntentThreshold = 10;

const shouldIgnoreTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest("[data-swipe-ignore]")) return true;
  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
};

export default function SwipeNavigation({
  leftRoute,
  rightRoute,
  onSwipeLeft,
  onSwipeRight,
  className,
  children,
}: SwipeNavigationProps) {
  const router = useRouter();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const isIgnored = useRef(false);

  const resetSwipe = () => {
    startX.current = null;
    startY.current = null;
    isSwiping.current = false;
    isIgnored.current = false;
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (shouldIgnoreTarget(event.target)) {
      isIgnored.current = true;
      return;
    }
    const touch = event.touches[0];
    startX.current = touch?.clientX ?? null;
    startY.current = touch?.clientY ?? null;
    isSwiping.current = false;
    isIgnored.current = false;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isIgnored.current || startX.current === null || startY.current === null) return;
    const touch = event.touches[0];
    const deltaX = (touch?.clientX ?? 0) - startX.current;
    const deltaY = (touch?.clientY ?? 0) - startY.current;

    if (!isSwiping.current) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeIntentThreshold) {
        isSwiping.current = true;
      } else {
        return;
      }
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isIgnored.current || startX.current === null) {
      resetSwipe();
      return;
    }
    if (!isSwiping.current) {
      resetSwipe();
      return;
    }
    const endX = event.changedTouches[0]?.clientX ?? startX.current;
    const deltaX = endX - startX.current;
    if (deltaX <= -swipeThreshold) {
      if (onSwipeLeft) {
        onSwipeLeft();
      } else if (leftRoute) {
        router.push(leftRoute);
      }
    } else if (deltaX >= swipeThreshold) {
      if (onSwipeRight) {
        onSwipeRight();
      } else if (rightRoute) {
        router.push(rightRoute);
      }
    }
    resetSwipe();
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetSwipe}
    >
      {children}
    </div>
  );
}
