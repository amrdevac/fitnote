"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminSidebar from "@/components/shared/Sidebar";
import HeaderDashboard from "@/components/shared/Header.Dashboard";

const queryClient = new QueryClient();

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = usePathname();

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen w-full bg-slate-100">
        {isSidebarOpen && (
          <div
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            aria-hidden="true"
          />
        )}

        <AdminSidebar isOpen={isSidebarOpen} />

        <div
          className={`flex flex-col transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "md:pl-64" : ""
          }`}
        >
          <HeaderDashboard onToggleSidebar={toggleSidebar} />
          <div className="flex-1 overflow-y-auto">
            <div className="p-8  relative  min-h-[calc(100vh-70px)] ">
              {children}
            </div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default AdminLayout;
