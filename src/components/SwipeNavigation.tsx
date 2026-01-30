"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type SwipeNavigationProps = {
  leftRoute?: string;
  rightRoute?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeProgress?: (progress: number) => void;
  animateSwipe?: boolean;
  className?: string;
  children: React.ReactNode;
};

const swipeThreshold = 80;
const swipeIntentThreshold = 10;
const swipeProgressDistance = 220;
const edgeSwipeThreshold = 24;

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

const hasScrollableParent = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  let node: HTMLElement | null = target;
  while (node) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
};

export default function SwipeNavigation({
  leftRoute,
  rightRoute,
  onSwipeLeft,
  onSwipeRight,
  onSwipeProgress,
  animateSwipe = true,
  className,
  children,
}: SwipeNavigationProps) {
  const router = useRouter();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const isIgnored = useRef(false);
  const hasProgressed = useRef(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  const applySwipeProgress = (progress: number) => {
    progressRef.current = progress;
    if (!animateSwipe) return;
    if (animationFrameRef.current) return;
    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      const node = contentRef.current;
      if (!node) return;
      if (progressRef.current === 0) {
        node.style.transform = "";
        node.style.opacity = "";
        node.style.transition = "";
        return;
      }
      const clamped = Math.min(1, Math.abs(progressRef.current));
      const scale = 1 - 0.04 * clamped;
      const opacity = 1 - 0.35 * clamped;
      node.style.transform = `scale(${scale})`;
      node.style.opacity = `${opacity}`;
      node.style.transition = "none";
    });
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const resetSwipe = () => {
    if (onSwipeProgress && hasProgressed.current) {
      onSwipeProgress(0);
    }
    if (hasProgressed.current) {
      applySwipeProgress(0);
    }
    startX.current = null;
    startY.current = null;
    isSwiping.current = false;
    isIgnored.current = false;
    hasProgressed.current = false;
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    const touchX = touch?.clientX ?? 0;
    const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
    const isEdgeStart =
      touchX <= edgeSwipeThreshold || touchX >= Math.max(0, viewportWidth - edgeSwipeThreshold);
    if (
      shouldIgnoreTarget(event.target) ||
      (hasScrollableParent(event.target) && !isEdgeStart)
    ) {
      isIgnored.current = true;
      return;
    }
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

    const progress = Math.max(-1, Math.min(1, deltaX / swipeProgressDistance));
    applySwipeProgress(progress);
    if (onSwipeProgress) {
      onSwipeProgress(progress);
    }
    hasProgressed.current = true;
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
      style={{ touchAction: "pan-y" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetSwipe}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
