"use client";
import React from "react";

const HeroSection = () => {
  storeCompanyData();
  return (
    <section
      className="relative min-h-screen w-full overflow-hidden"
      aria-label="Welcome section"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1e2a63_0%,_#0f1e3f_40%,_#0a1630_100%)]" />
      <div className="absolute inset-0 opacity-60 bg-[radial-gradient(white_1px,transparent_1px)] bg-[size:3px_3px]" />

      {/* Moon */}
      <div className="absolute right-[16%] top-[14%] h-24 w-24 rounded-full bg-white/95 shadow-[0_0_60px_20px_rgba(255,255,255,0.15)]" />

      {/* Mountains */}
      <svg
        className="absolute bottom-32 left-1/2 -translate-x-1/2 w-[140%] max-w-none"
        viewBox="0 0 1440 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M0 220 L180 150 L300 210 L460 120 L620 210 L780 140 L980 220 L1150 160 L1320 210 L1440 180 L1440 300 L0 300 Z"
          fill="#1b2b66"
        />
        <path
          d="M0 240 L100 180 L260 230 L420 160 L580 230 L760 170 L920 240 L1120 180 L1260 230 L1440 200 L1440 300 L0 300 Z"
          fill="#233573"
        />
        <path
          d="M0 260 L140 210 L300 250 L460 200 L640 250 L820 210 L980 260 L1160 200 L1300 250 L1440 230 L1440 300 L0 300 Z"
          fill="#2b3f80"
        />
      </svg>

      {/* Foreground ground */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-[#0c1534]" />

      {/* Tree silhouettes */}
      <svg
        className="pointer-events-none absolute left-0 bottom-0 h-[110%] w-auto text-[#0d1a3e]"
        viewBox="0 0 200 400"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path d="M20 400 L35 220 L15 230 L45 170 L25 180 L60 120 L40 130 L85 60 L65 70 L120 0 L130 0 L95 90 L115 80 L75 150 L95 140 L60 200 L80 190 L55 250 L75 240 L60 400 Z" />
      </svg>
      <svg
        className="pointer-events-none absolute right-0 bottom-0 h-[110%] w-auto text-[#0d1a3e]"
        viewBox="0 0 200 400"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path d="M180 400 L165 220 L185 230 L155 170 L175 180 L140 120 L160 130 L115 60 L135 70 L80 0 L70 0 L105 90 L85 80 L125 150 L105 140 L140 200 L120 190 L145 250 L125 240 L140 400 Z" />
      </svg>

      {/* Center text */}
      <div className="relative z-10 flex min-h-screen items-center justify-center text-center">
        <div className="px-6">
          <h1 className="text-5xl md:text-7xl font-semibold tracking-wide text-white/95">
            welcome
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-slate-200/80">
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
            nonummy
          </p>
        </div>
      </div>
    </section>
  );
};

import storeCompanyData from "@/store/CompanyInfo";

const LandingPage = () => {
  return (
    <>
      {/* <ThemeSwitcher /> */}
      <HeroSection />
    </>
  );
};

export default LandingPage;
