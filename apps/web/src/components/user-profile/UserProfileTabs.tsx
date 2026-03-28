import { BookOpen, MessageSquare } from "lucide-react";

import { cn } from "@PeerFolio/ui/lib/utils";

import type { UserProfileTab } from "./types";

type UserProfileTabsProps = {
  activeTab: UserProfileTab;
  onTabChange: (tab: UserProfileTab) => void;
  portfoliosCount: number;
  critiquesCount: number;
};

export function UserProfileTabs({
  activeTab,
  onTabChange,
  portfoliosCount,
  critiquesCount,
}: UserProfileTabsProps) {
  return (
    <div className="flex gap-6 px-1">
      <button
        type="button"
        onClick={() => onTabChange("portfolios")}
        className={cn(
          "relative inline-flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm transition-colors",
          activeTab === "portfolios"
            ? "text-primary"
            : "text-on-surface-variant hover:text-on-surface"
        )}
      >
        <BookOpen className="h-4 w-4" />
        Portfólios
        <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-xs text-on-surface-variant">
          {portfoliosCount}
        </span>
        {activeTab === "portfolios" ? (
          <span className="absolute -bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-primary" />
        ) : null}
      </button>

      <button
        type="button"
        onClick={() => onTabChange("critiques")}
        className={cn(
          "relative inline-flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm transition-colors",
          activeTab === "critiques"
            ? "text-primary"
            : "text-on-surface-variant hover:text-on-surface"
        )}
      >
        <MessageSquare className="h-4 w-4" />
        Críticas
        <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-xs text-on-surface-variant">
          {critiquesCount}
        </span>
        {activeTab === "critiques" ? (
          <span className="absolute -bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-primary" />
        ) : null}
      </button>
    </div>
  );
}
