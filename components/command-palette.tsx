"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Upload, History, Home } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              router.push("/");
              setOpen(false);
            }}
          >
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Home</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              router.push("/upload");
              setOpen(false);
            }}
          >
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Upload Screenshots</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              router.push("/history");
              setOpen(false);
            }}
          >
            <History className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>View History</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
