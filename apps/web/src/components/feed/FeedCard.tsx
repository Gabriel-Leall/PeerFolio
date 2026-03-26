"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@PeerFolio/backend/convex/_generated/api";
import type { Id } from "@PeerFolio/backend/convex/_generated/dataModel";
import { cn } from "@PeerFolio/ui/lib/utils";
import { useMutation } from "convex/react";
import { Globe, Heart, MessageSquare, Star } from "lucide-react";
import { useState } from "react";

import AuthModal from "@/components/AuthModal";
import { TruncatedText } from "@/components/TruncatedText";

// ---------------------------------------------------------------------------
// Types (re-exported for convenience)
// ---------------------------------------------------------------------------

export type FeedCardData = {
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
  lastCritiqueAt?: number;
  isDeleted: boolean;
  createdAt: number;
  authorId: Id<"users">;
  hasLiked?: boolean;
  urlStatus?: "online" | "offline" | "unchecked";
  consecutiveOfflineCount?: number;
  author: {
    _id: Id<"users">;
    nickname?: string;
    avatarUrl?: string;
    primaryArea?: string;
  };
};

// ---------------------------------------------------------------------------
// Editorial Feed Card
// ---------------------------------------------------------------------------

interface FeedCardProps {
  portfolio: FeedCardData;
  /** Called when user wants to open the full preview modal */
  onOpenModal?: (portfolio: FeedCardData) => void;
}

export function FeedCard({ portfolio, onOpenModal }: FeedCardProps) {
  const { isSignedIn } = useUser();
  const toggleLike = useMutation(api.likes.mutations.toggle);

  const [localLikeCount, setLocalLikeCount] = useState(portfolio.likeCount);
  const [localHasLiked, setLocalHasLiked] = useState(!!portfolio.hasLiked);
  const [isLiking, setIsLiking] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const displayName = portfolio.author.nickname ?? "Anônimo";
  const showOfflineBadge =
    portfolio.urlStatus === "offline" &&
    (portfolio.consecutiveOfflineCount ?? 0) >= 3;

  // Mock portfolios have synthetic IDs (e.g. "mock_001") that are not valid
  // Convex document IDs. We must skip any real backend calls for them.
  const isMock = portfolio._id?.toString().startsWith("mock_");

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Silently toggle local state for mock entries — no backend call
    if (isMock) {
      setLocalHasLiked((prev) => !prev);
      setLocalLikeCount((prev) => (localHasLiked ? prev - 1 : prev + 1));
      return;
    }

    if (!isSignedIn) {
      setShowAuthModal(true);
      return;
    }
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic update
    const wasLiked = localHasLiked;
    setLocalHasLiked(!wasLiked);
    setLocalLikeCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      const result = await toggleLike({ portfolioId: portfolio._id });
      setLocalHasLiked(result.liked);
      setLocalLikeCount(result.likeCount);
    } catch {
      setLocalHasLiked(wasLiked);
      setLocalLikeCount(portfolio.likeCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCardClick = () => {
    onOpenModal?.(portfolio);
  };

  return (
    <>
      <article
        className="group relative flex flex-col gap-4 cursor-pointer"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        aria-label={`Ver projeto ${portfolio.title} de ${displayName}`}
      >
        {/* Image Container */}
        <div className="relative aspect-4/5 overflow-hidden rounded-lg bg-surface-container-low border border-border/5 focus-within:ring-2 focus-within:ring-primary/40">
          {portfolio.previewImageUrl ? (
            <img
              src={portfolio.previewImageUrl}
              alt={`Preview do portfólio ${portfolio.title}`}
              className="h-full w-full object-cover transition-transform duration-700 ease-out opacity-80 group-hover:scale-105 group-hover:opacity-100"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 to-secondary/10">
              <Globe className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Badges Row */}
          <div className="absolute left-3 top-3 right-3 flex items-start justify-between">
            <span className="inline-flex items-center rounded-md bg-background/90 px-2.5 py-1 text-[11px] font-semibold shadow backdrop-blur-sm">
              {portfolio.area}
            </span>
            {showOfflineBadge && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/90 px-2.5 py-1 text-[11px] font-medium text-white shadow backdrop-blur-sm">
                Site fora do ar
              </span>
            )}
          </div>

          {/* Hover Overlay CTA */}
          <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
            <span
              className="w-full py-2.5 rounded-md bg-primary/20 backdrop-blur-md border border-primary/20 text-primary font-medium text-sm text-center"
              aria-hidden
            >
              Ver Projeto
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex items-start justify-between">
          {/* Title + Author */}
          <div className="min-w-0 flex-1 pr-3">
            <h3 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors duration-200 leading-snug">
              <TruncatedText text={portfolio.title} maxLength={50} />
            </h3>
            <p className="font-sans mt-1 text-xs text-muted-foreground truncate flex items-center gap-1.5">
              {portfolio.author.avatarUrl ? (
                <img
                  src={portfolio.author.avatarUrl}
                  alt={displayName}
                  className="h-4 w-4 rounded-sm object-cover"
                />
              ) : (
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-secondary text-[9px] font-bold text-secondary-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
              {displayName}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {/* Likes (interactive) */}
            <button
              type="button"
              onClick={handleLike}
              disabled={isLiking}
              aria-label={
                localHasLiked ? "Remover curtida" : "Curtir portfólio"
              }
              className={cn(
                "flex cursor-pointer items-center gap-1 text-xs font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                localHasLiked
                  ? "text-red-400 hover:text-red-500"
                  : "text-muted-foreground hover:text-red-400"
              )}
            >
              <Heart
                className="h-3.5 w-3.5"
                fill={localHasLiked ? "currentColor" : "none"}
              />
              <span>{localLikeCount}</span>
            </button>

            {/* Rating */}
            {portfolio.averageRating > 0 && (
              <div
                className="flex items-center gap-1 text-xs text-amber-400 font-bold"
                title={`Média: ${portfolio.averageRating.toFixed(1)} estrelas`}
              >
                <Star className="h-3 w-3" fill="currentColor" />
                <span>{portfolio.averageRating.toFixed(1)}</span>
              </div>
            )}

            {/* Critiques */}
            <div
              className="flex items-center gap-1 text-xs text-muted-foreground"
              title={`${portfolio.critiqueCount} crítica${portfolio.critiqueCount !== 1 ? "s" : ""}`}
            >
              <MessageSquare className="h-3 w-3" />
              <span>{portfolio.critiqueCount}</span>
            </div>
          </div>
        </div>
      </article>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Entre para continuar"
        description="Faça login para curtir e salvar este portfólio."
        redirectTo={isMock ? "/feed" : `/portfolio/${portfolio._id}`}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

export function FeedCardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="aspect-4/5 animate-pulse rounded-lg bg-surface-container-low" />
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2 pr-3">
          <div className="h-5 w-3/4 animate-pulse rounded-md bg-surface-container" />
          <div className="h-3 w-1/2 animate-pulse rounded-md bg-surface-container" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-3 w-8 animate-pulse rounded-md bg-surface-container" />
          <div className="h-3 w-6 animate-pulse rounded-md bg-surface-container" />
        </div>
      </div>
    </div>
  );
}
