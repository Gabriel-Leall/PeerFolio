"use client";

import { useTransition } from "react";
import { cn } from "@PeerFolio/ui/lib/utils";

export type FeedFilter = "latest" | "topRated";

interface FeedTabsProps {
  currentFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

export function FeedTabs({ currentFilter, onFilterChange }: FeedTabsProps) {
  const [isPending, startTransition] = useTransition();

  const handleTabClick = (filter: FeedFilter) => {
    startTransition(() => {
      onFilterChange(filter);
    });
  };

  const tabs: {
    id: FeedFilter;
    label: string;
    disabled?: boolean;
    badge?: string;
  }[] = [
    {
      id: "latest",
      label: "Recentes",
    },
    {
      id: "topRated",
      label: "Melhor Avaliados",
    },
  ];

  return (
    <div className="flex w-full items-center overflow-x-auto border-b pb-0 scrollbar-hide">
      <div className="flex space-x-6">
        {tabs.map((tab) => {
          const isActive = currentFilter === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled || isPending}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "group relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
                tab.disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {tab.label}

              {tab.badge && (
                <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase font-bold text-secondary-foreground shadow-xs">
                  {tab.badge}
                </span>
              )}

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
