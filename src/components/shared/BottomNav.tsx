"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArchiveIcon, BarChart3Icon, HomeIcon, PlusIcon, Settings2Icon, TimerIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTabataPlayerStore } from "@/store/tabataPlayer";

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: HomeIcon,
    isActive: (pathname: string) => pathname === "/",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3Icon,
    isActive: (pathname: string) => pathname.startsWith("/reports"),
  },
  {
    href: "/builder",
    label: "Builder",
    icon: PlusIcon,
    isActive: (pathname: string) => pathname.startsWith("/builder"),
  },
  {
    href: "/timers",
    label: "Timer",
    icon: TimerIcon,
    isActive: (pathname: string) => pathname.startsWith("/timers"),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings2Icon,
    isActive: (pathname: string) => pathname.startsWith("/settings"),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const isPlayerActive = useTabataPlayerStore(
    (state) => state.queue.length > 0 && state.status !== "idle"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const updateNavHeight = () => {
      const height = navRef.current?.offsetHeight ?? 0;
      root.style.setProperty("--bottom-nav-height", `${height}px`);
    };
    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);
    return () => {
      window.removeEventListener("resize", updateNavHeight);
      root.style.removeProperty("--bottom-nav-height");
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <nav
      aria-label="Bottom navigation"
      ref={navRef}
      className="fixed inset-x-0 bottom-0 z-[100]"
    >
      <div className="w-full">
        <div
          className={cn(
            "relative flex w-full items-center justify-between gap-2 bg-white/95 px-6 py-3 backdrop-blur",
            !isPlayerActive && "shadow-[0_-12px_30px_rgba(15,23,42,0.12)]"
          )}
        >
          {navItems.slice(0, 2).map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-16 flex-col items-center gap-1 text-[11px] font-semibold transition",
                  active ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-indigo-600")} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <Link
            href="/builder"
            aria-current={pathname.startsWith("/builder") ? "page" : undefined}
            style={{
              transform:
                "translateX(-50%) translateY(clamp(0px, calc(var(--player-offset, 0px) / 6), 18px))",
            }}
            className={cn(
              "absolute left-1/2 -top-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_16px_32px_rgba(79,70,229,0.4)] transition active:scale-[0.96]",
              pathname.startsWith("/builder") && "bg-indigo-500"
            )}
          >
            <PlusIcon className="h-6 w-6" aria-hidden />
          </Link>

          <div aria-hidden className="w-16" />

          {navItems.slice(3).map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-16 flex-col items-center gap-1 text-[11px] font-semibold transition",
                  active ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-indigo-600")} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>,
    document.body
  );
}
