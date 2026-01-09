"use client";
import React from "react";
import LogoIcon from "./LogoIcon";
import Image from "next/image";
import storeCompanyData from "@/store/CompanyInfo";
import useSiteMeta from "@/store/siteMeta";

const Footer: React.FC = () => {
  const storeCmpnyInfo = storeCompanyData();
  const { meta } = useSiteMeta();

  return (
    <footer id="contact" className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4  lg:px-40 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Column 1: About */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div>
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
              </div>
              <div>{storeCmpnyInfo.companyInfo?.name}</div>
            </div>
            <p className="text-sm text-slate-400">
              {storeCmpnyInfo.companyInfo?.full_description}
            </p>
          </div>

          {/* Column 2: Location */}
          {storeCmpnyInfo.companyInfo?.img_map && (
            <div>
              <p className="text-lg font-semibold text-white mb-4">Location</p>
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                <a
                  href={storeCmpnyInfo.companyInfo?.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src={storeCmpnyInfo.companyInfo?.img_map}
                    alt="Company location map"
                    className="w-full h-full object-cover"
                    width="400"
                    height="225"
                  />
                </a>
              </div>
            </div>
          )}

          {/* Column 3: Contact */}
          <div>
            <p className="text-lg font-semibold text-white mb-4">Contact</p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <i className="fas fa-map-pin h-5 w-5 mt-1 mr-3 flex-shrink-0 text-orange-400"></i>
                <span>{storeCmpnyInfo.companyInfo?.address}</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-phone h-5 w-5 mr-3 flex-shrink-0 text-orange-400"></i>
                <a href="tel:+622153670477" className="hover:text-white">
                  <span>{storeCmpnyInfo.companyInfo?.phone}</span>
                </a>
              </li>
              <li className="flex items-center">
                <i className="fas fa-envelope h-5 w-5 mr-3 flex-shrink-0 text-orange-400"></i>
                <a
                  href="mailto:info@adhirajasa.com"
                  className="hover:text-white"
                >
                  <span>{storeCmpnyInfo.companyInfo?.email}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-slate-950 py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          <p>Copyright © 2025 PT. Adhirajasa Sarana Utama</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
