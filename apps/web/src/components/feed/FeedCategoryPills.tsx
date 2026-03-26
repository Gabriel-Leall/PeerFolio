"use client";

import { cn } from "@PeerFolio/ui/lib/utils";

const CATEGORIES = [
  { label: "Todos", value: undefined },
  { label: "Frontend", value: "Frontend" },
  { label: "Backend", value: "Backend" },
  { label: "Fullstack", value: "Fullstack" },
  { label: "UI/UX", value: "UI/UX" },
  { label: "Mobile", value: "Mobile" },
  { label: "Outros", value: "Other" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

interface FeedCategoryPillsProps {
  selected: CategoryValue;
  onSelect: (value: CategoryValue) => void;
  className?: string;
}

export function FeedCategoryPills({
  selected,
  onSelect,
  className,
}: FeedCategoryPillsProps) {
  return (
    <section
      aria-label="Filtrar por categoria"
      className={cn(
        "overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0",
        className
      )}
    >
      <div className="flex items-center gap-2 pb-2 sm:pb-0">
        {CATEGORIES.map((cat) => {
          const isActive = selected === cat.value;
          return (
            <button
              key={cat.label}
              type="button"
              onClick={() => onSelect(cat.value)}
              aria-pressed={isActive}
              className={cn(
                "shrink-0 cursor-pointer whitespace-nowrap rounded-md border px-5 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                isActive
                  ? "border-primary/60 bg-primary/15 text-primary shadow-sm"
                  : "border-border bg-surface-container text-muted-foreground hover:border-primary/30 hover:bg-surface-container-high hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export type { CategoryValue };
