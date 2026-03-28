"use client";

import { Button } from "@PeerFolio/ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { cn } from "@PeerFolio/ui/lib/utils";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export function FloatingSubmitButton() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Determine if we should show the button on this page
  // We probably don't want it on the actual /submit page or the landing page
  const isLandingPage = pathname === "/";
  const isSubmitPage = pathname === "/submit";
  
  const shouldShow = !isLandingPage && !isSubmitPage && isSignedIn;

  useEffect(() => {
    if (!shouldShow) return;

    // Show expanded initially, then collapse after a short delay
    const initialTimer = setTimeout(() => {
      setIsExpanded(false);
    }, 2500);

    const handleScroll = () => {
      // If we scroll, collapse immediately
      setIsExpanded(false);
      
      // Clear any pending expand timers
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(initialTimer);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex justify-end"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <Button
        render={<Link href="/submit" />}
        nativeButton={false}
        className={cn(
          "group relative flex items-center justify-center bg-primary hover:bg-secondary text-white shadow-[0_0_20px_rgba(132,94,247,0.3)] hover:shadow-[0_0_30px_rgba(132,94,247,0.5)] transition-all duration-300 ease-in-out border border-white/10 p-0 overflow-hidden !rounded-full h-14",
          isExpanded ? "w-[144px]" : "w-14"
        )}
      >
        <div className="absolute inset-0 flex items-center justify-end w-full h-full pointer-events-none">
          <span
            className={cn(
              "absolute left-6 font-medium whitespace-nowrap transition-all duration-300",
              isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            )}
          >
            Submeter
          </span>
          <div className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center transition-all duration-300",
            isExpanded ? "mr-1" : "mr-0"
          )}>
            <Plus className="h-6 w-6 transition-transform duration-300" />
          </div>
        </div>
      </Button>
    </div>
  );
}
