import { MessageSquare, Star, ThumbsUp } from "lucide-react";
import Link from "next/link";

import type { UserProfilePortfolio } from "./types";

type UserProfilePortfolioCardXLProps = {
  portfolio: UserProfilePortfolio;
};

export function UserProfilePortfolioCardXL({ portfolio }: UserProfilePortfolioCardXLProps) {
  return (
    <Link
      href={`/portfolio/${portfolio._id}`}
      className="group block overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-surface-container-high">
        {portfolio.previewImageUrl ? (
          <img
            src={portfolio.previewImageUrl}
            alt={`Preview de ${portfolio.title}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-surface-container-high to-surface-container" />
        )}
      </div>

      <div className="space-y-3 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
          {portfolio.area}
        </p>
        <h3 className="font-serif text-3xl italic leading-tight text-on-surface">
          {portfolio.title}
        </h3>

        <div className="flex items-center gap-4 text-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-400" />
            {portfolio.averageRating > 0 ? portfolio.averageRating.toFixed(1) : "—"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            {portfolio.critiqueCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ThumbsUp className="h-4 w-4" />
            {portfolio.likeCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
