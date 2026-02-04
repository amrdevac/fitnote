"use client";

import { ArrowLeftIcon, ArrowLeftRight, ArrowRightIcon, MoreVerticalIcon } from "lucide-react";
import { Button } from "@/ui/button";

type PageHeaderProps = {
  title: string;
  onBack?: () => void;
  onSettings?: () => void;
  backPosition?: "left" | "right";
  className?: string;
};

const PageHeader = ({
  title,
  onBack,
  onSettings,
  backPosition = "left",
  className = "",
}: PageHeaderProps) => {
  const renderBack = Boolean(onBack);
  const renderSettings = Boolean(onSettings);
  const backButton = renderBack ? (
    <Button
      variant="ghost"
      size="icon"
      onClick={onBack}
      className="text-slate-600"
      aria-label="Kembali"
    >
      {backPosition == "left" && <ArrowLeftIcon className="size-5" />}
      {backPosition != "left" && <ArrowRightIcon className="size-5" />}
      
    </Button>
  ) : (
    <div className="size-10" aria-hidden="true" />
  );

  const settingsButton = renderSettings ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onSettings}
      aria-label="Pengaturan"
      className=" text-slate-600"
    >
      <MoreVerticalIcon className="size-5" />
    </Button>
  ) : (
    <div className="size-10" aria-hidden="true" />
  );

  const leftSlot = backPosition === "left" ? backButton : settingsButton;
  const rightSlot = backPosition === "left" ? settingsButton : backButton;

  return (
    <header className={`flex items-center justify-between ${className}`}>
      {leftSlot}
      <div className="flex items-center gap-3 rounded-full  px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 ">
        {title}
      </div>
      {rightSlot}
    </header>
  );
};

export default PageHeader;
