"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, PlusIcon, TimerIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/timers",
    label: "Timer",
    icon: TimerIcon,
    isActive: (pathname: string) => pathname.startsWith("/timers"),
  },
  {
    href: "/",
    label: "Home",
    icon: HomeIcon,
    isActive: (pathname: string) => pathname === "/",
  },
  {
    href: "/builder",
    label: "Builder",
    icon: PlusIcon,
    isActive: (pathname: string) => pathname.startsWith("/builder"),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement | null>(null);

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

  return (
    <nav
      aria-label="Bottom navigation"
      ref={navRef}
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-4 pb-[calc(0.35rem+env(safe-area-inset-bottom))] pt-1.5">
        {navItems.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex w-14 flex-col items-center gap-0.5 text-[11px] font-medium transition",
                active ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-indigo-600")} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
