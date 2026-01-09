"use client";
import React from "react";
import { LayoutDashboard, Boxes } from "lucide-react";
import LogoIcon from "./LogoIcon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import useSiteMeta from "@/store/siteMeta";

const adminNavLinks = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Components", path: "/dashboard/components", icon: Boxes },
];

interface AdminSidebarProps {
  isOpen: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen }) => {
  const pathname = usePathname();
  const { meta } = useSiteMeta();
  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-full w-64 bg-slate-800 text-slate-300 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="h-16 flex items-center justify-center px-4 bg-slate-900">
        <Link href="/dashboard" className="flex items-center space-x-2">
          {meta?.logo ? (
            <Image
              src={meta.logo}
              alt="Logo"
              width={40}
              height={40}
              className="bg-white rounded-full p-1 h-7 w-7 object-contain"
            />
          ) : (
            <LogoIcon />
          )}
          <span className="font-bold text-lg text-white">Admin Panel</span>
        </Link>
      </div>
      <nav className="flex-grow px-2 py-4 overflow-y-auto">
        {adminNavLinks.map((link) => (
          <Link
            key={link.name}
            href={link.path}
            className={cn(
              `flex items-center px-4 py-2 mt-1 text-sm rounded-lg transition-colors duration-200 hover:bg-slate-700 hover:text-white`,
              pathname == link.path ? "bg-slate-700" : ""
            )}
          >
            <link.icon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">{link.name}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <Link
          href="/"
          className="block w-full text-center px-4 py-2 rounded-lg text-sm text-white bg-brand"
        >
          View Public Site
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
