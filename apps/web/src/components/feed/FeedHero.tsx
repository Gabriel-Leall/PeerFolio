"use client";

import { cn } from "@PeerFolio/ui/lib/utils";

interface FeedHeroProps {
  className?: string;
}

export function FeedHero({ className }: FeedHeroProps) {
  return (
    <header className={cn("mb-12 md:mb-16", className)}>
      <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl mb-4">
        O Feed{" "}
        <em className="font-serif italic text-primary">Etéreo</em>
      </h1>
      <p className="font-sans text-muted-foreground max-w-xl text-base leading-relaxed sm:text-lg">
        Uma curadoria de craftsmanship digital, portfólios de excelência e
        trabalhos que inspiram. Explore, critique e evolua.
      </p>
    </header>
  );
}
