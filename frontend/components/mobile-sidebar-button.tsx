"use client";

import { PanelLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function MobileSidebarButton() {
  const { setOpenMobile } = useSidebar();

  const openMenu = () => {
    setOpenMobile(true);
  };

  return (
    <Button
      aria-label="Open menu"
      className="relative z-40 touch-manipulation md:hidden"
      onClick={openMenu}
      onTouchEnd={openMenu}
      size="icon-lg"
      type="button"
      variant="outline"
    >
      <PanelLeftIcon />
    </Button>
  );
}
