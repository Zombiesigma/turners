"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type SearchOverlayProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export function SearchOverlay({ isOpen, setIsOpen }: SearchOverlayProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setIsOpen]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm transition-opacity",
        isOpen ? "opacity-100 flex items-center justify-center" : "opacity-0 pointer-events-none hidden"
      )}
      onClick={() => setIsOpen(false)}
    >
      <div className="w-full max-w-lg px-4" onClick={(e) => e.stopPropagation()}>
        <Input
          type="search"
          placeholder="Cari karya, artikel, atau proyek..."
          className="h-14 w-full border-0 border-b-2 bg-transparent text-xl focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 h-10 w-10"
        onClick={() => setIsOpen(false)}
      >
        <X className="h-6 w-6" />
        <span className="sr-only">Close search</span>
      </Button>
    </div>
  );
}
