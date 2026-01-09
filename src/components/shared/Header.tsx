"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import LogoIcon from "./LogoIcon";
import { usePathname } from "next/navigation";
import { CircleXIcon, MenuIcon } from "lucide-react";
import storeCompanyData from "@/store/CompanyInfo";
import Image from "next/image";
import useSiteMeta from "@/store/siteMeta";
import { About } from "@/data/about";
const navLinks = [
  { name: "Home", path: "/" },
  { name: "Documentation", path: "/documentation" },
];

type LandingPageType = {
  companyInfo: About.Company | null;
};

const Header = ({ companyInfo }: LandingPageType) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const storeCmpnyInfo = storeCompanyData();
  const { meta } = useSiteMeta();

  useEffect(() => {
    storeCmpnyInfo.setCompanyInfo(companyInfo);
  }, [companyInfo, storeCmpnyInfo]);

  const isHome = pathname === "/";

  return (
    <header
      className={
        isHome
          ? "absolute top-0 left-0 right-0 z-50 bg-transparent"
          : "bg-white shadow-md sticky top-0 z-50"
      }
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-40">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              {meta?.logo ? (
                <Image
                  src={meta.logo}
                  alt="Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <LogoIcon />
              )}
              <div
                className={
                  "font-bold text-xs max-w-[120px] " +
                  (isHome ? "text-white" : "text-slate-800")
                }
              >
                {storeCmpnyInfo.companyInfo?.name}
              </div>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`px-3 py-2  text-sm font-medium rounded-none ${
                    isHome
                      ? "text-white/90 hover:text-white"
                      : pathname === link.path
                      ? "text-primary border-b-2 border-brand"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  aria-current={pathname === link.path ? "page" : undefined}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className={
                (isHome
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200") +
                " inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
              }
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <CircleXIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden" id="mobile-menu" data-aos="fade-down">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isHome
                    ? "text-white hover:bg-white/10"
                    : pathname === link.path
                    ? "text-primary bg-slate-100"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                aria-current={pathname === link.path ? "page" : undefined}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
