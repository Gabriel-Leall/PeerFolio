import { MessageSquare, Star, ThumbsUp } from "lucide-react";
import Link from "next/link";

import type { UserProfileCritique } from "./types";
import { relativeTime } from "./utils";

type UserProfileCritiqueCardXLProps = {
  critique: UserProfileCritique;
};

export function UserProfileCritiqueCardXL({
  critique,
}: UserProfileCritiqueCardXLProps) {
  return (
    <article className="rounded-xl border border-outline-variant/20 bg-surface-container p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-on-surface-variant">
        <MessageSquare className="h-4 w-4" />
        {critique.portfolioTitle ? (
          <Link
            href={`/portfolio/${critique.portfolioId}`}
            className="hover:text-primary hover:underline"
          >
            {critique.portfolioTitle}
          </Link>
        ) : (
          <span>Portfólio removido</span>
        )}
      </div>

      <p className="mt-4 text-base leading-relaxed text-on-surface">
        {critique.feedback}
      </p>

      <div className="mt-5 flex items-center gap-4 text-sm text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5">
          <Star className="h-4 w-4 text-amber-400" />
          {critique.rating.toFixed(1)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ThumbsUp className="h-4 w-4" />
          {critique.upvotes}
        </span>
        <span>{relativeTime(critique.createdAt)}</span>
      </div>
    </article>
  );
}
