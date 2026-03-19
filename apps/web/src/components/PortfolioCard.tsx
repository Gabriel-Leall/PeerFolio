"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@PeerFolio/backend/convex/_generated/api";
import type { Id } from "@PeerFolio/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Globe, Heart, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import AuthModal from "@/components/AuthModal";

// ---------------------------------------------------------------------------
// Type derived from portfolios.list query return
// ---------------------------------------------------------------------------

export type PortfolioCardData = {
  _id: Id<"portfolios">;
  _creationTime: number;
  url: string;
  normalizedUrl: string;
  title: string;
  area: string;
  stack: string[];
  goalsContext?: string;
  previewImageUrl?: string;
  averageRating: number;
  critiqueCount: number;
  likeCount: number;
  topRatedScore: number;
  isDeleted: boolean;
  createdAt: number;
  authorId: Id<"users">;
  hasLiked?: boolean;
  author: {
    _id: Id<"users">;
    nickname?: string;
    avatarUrl?: string;
    primaryArea?: string;
  };
};

// ---------------------------------------------------------------------------
// Portfolio Card Component
// ---------------------------------------------------------------------------

export default function PortfolioCard({
  portfolio,
}: {
  portfolio: PortfolioCardData;
}) {
  const { isSignedIn, user } = useUser();
  const toggleLikeMutation = useMutation(api["likes/mutations"].toggle);

  const [localLikeCount, setLocalLikeCount] = useState(portfolio.likeCount);
  const [localHasLiked, setLocalHasLiked] = useState<boolean>(!!portfolio.hasLiked);
  const [isLiking, setIsLiking] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const displayName = portfolio.author.nickname ?? "Anônimo";
  // The backend might return different values for clerkId and authorId, so we 
  // do a best effort client-side check if user is the author if we knew their _id.
  // Actually, we can just block it based on standard logic, but Convex will throw anyway.
  
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      setShowAuthModal(true);
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    // Optimistic toggle
    setLocalHasLiked(!localHasLiked);
    setLocalLikeCount((prev) => (localHasLiked ? prev - 1 : prev + 1));

    try {
      const result = await toggleLikeMutation({ portfolioId: portfolio._id });
      setLocalHasLiked(result.liked);
      setLocalLikeCount(result.likeCount);
    } catch {
      // Revert optimism if failed (e.g., self-like error)
      setLocalHasLiked(localHasLiked);
      setLocalLikeCount(localLikeCount);
    } finally {
      setIsLiking(false);
    }
  };

  const truncatedTitle =
    portfolio.title.length > 60
      ? portfolio.title.slice(0, 57) + "..."
      : portfolio.title;

  return (
    <>
      <Link
        href={`/portfolio/${portfolio._id}`}
        className="group relative flex flex-col overflow-hidden rounded-xl border bg-background transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Preview Image or Fallback */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {portfolio.previewImageUrl ? (
            <img
              src={portfolio.previewImageUrl}
              alt={`Preview do site ${portfolio.title}`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 to-secondary/10">
              <Globe className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}

          {/* Top Badges overlay */}
          <div className="absolute left-3 top-3 right-3 flex justify-between">
            <span className="inline-flex items-center rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-semibold shadow-xs backdrop-blur-xs">
              {portfolio.area}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <h3
            className="line-clamp-2 text-lg font-semibold leading-tight tracking-tight sm:text-xl"
            title={portfolio.title.length > 60 ? portfolio.title : undefined}
          >
            {truncatedTitle}
          </h3>

          <p className="mt-1 truncate text-sm text-muted-foreground">
            {portfolio.normalizedUrl}
          </p>

          <div className="mt-auto pt-4 flex items-center justify-between">
            {/* Author */}
            <object>
              <Link
                href={`/dashboard/${portfolio.authorId}`}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                {portfolio.author.avatarUrl ? (
                  <img
                    src={portfolio.author.avatarUrl}
                    alt={displayName}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-medium text-secondary-foreground">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="truncate text-sm font-medium">
                  {displayName}
                </span>
              </Link>
            </object>

            {/* Stats row */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {/* Rating */}
              <div
                className="flex items-center gap-1"
                title={`Média: ${portfolio.averageRating.toFixed(1)} estrelas`}
              >
                <span className="text-amber-400">★</span>
                <span className="font-medium text-foreground">
                  {portfolio.averageRating > 0
                    ? portfolio.averageRating.toFixed(1)
                    : "—"}
                </span>
              </div>

              {/* Critiques */}
              <div
                className="flex items-center gap-1"
                title={`${portfolio.critiqueCount} crítica${portfolio.critiqueCount !== 1 ? "s" : ""}`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{portfolio.critiqueCount}</span>
              </div>

              {/* Likes */}
              <object>
                <button
                  type="button"
                  onClick={handleLike}
                  className={`flex items-center gap-1 transition ${
                    localHasLiked
                      ? "text-red-500 hover:text-red-600"
                      : "hover:text-red-500"
                  }`}
                  aria-label={
                    localHasLiked
                      ? "Remover like deste portfólio"
                      : "Dar like neste portfólio"
                  }
                  title={
                    localHasLiked
                      ? "Remover like deste portfólio"
                      : "Dar like neste portfólio"
                  }
                >
                  <Heart
                    className="h-4 w-4"
                    fill={localHasLiked ? "currentColor" : "none"}
                  />
                  <span>{localLikeCount}</span>
                </button>
              </object>
            </div>
          </div>
        </div>
      </Link>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Entre para continuar"
        description="Faça login para curtir e salvar este portfólio."
        redirectTo={`/portfolio/${portfolio._id}`}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Loading Variant
// ---------------------------------------------------------------------------

export function PortfolioCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-background">
      <div className="relative aspect-video w-full animate-pulse bg-muted" />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 h-6 w-3/4 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="flex gap-3">
             <div className="h-4 w-8 animate-pulse rounded-md bg-muted" />
             <div className="h-4 w-8 animate-pulse rounded-md bg-muted" />
             <div className="h-4 w-8 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
