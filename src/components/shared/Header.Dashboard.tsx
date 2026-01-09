import React from "react";
import { Button } from "../../components/ui/button";
import { LayoutDashboard } from "lucide-react";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

const HeaderDashboard: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-white/95 backdrop-blur-sm px-4 md:px-6 flex-shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <LayoutDashboard className="h-6 w-6" />
      </Button>
      {/* Future content like breadcrumbs or user menu can go here */}
    </header>
  );
};

export default HeaderDashboard;
