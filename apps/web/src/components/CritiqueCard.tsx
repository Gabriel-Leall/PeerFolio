"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@PeerFolio/backend/convex/_generated/api";
import type { Id } from "@PeerFolio/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import Link from "next/link";
import { useState } from "react";

import AuthModal from "@/components/AuthModal";
import { getProfileRoute } from "@/lib/profile-route";

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

function relativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSecs = Math.floor(diffMs / 1_000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `há ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
  if (diffHours > 0) return `há ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  if (diffMins > 0) return `há ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
  return "agora mesmo";
}

// ---------------------------------------------------------------------------
// Star display sub-component
// ---------------------------------------------------------------------------

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} de 5 estrelas`} className="text-sm text-amber-400">
      {"★".repeat(rating)}
      <span className="text-muted-foreground/30">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// CritiqueCard
// ---------------------------------------------------------------------------

type CritiqueCardProps = {
  critiqueId: Id<"critiques">;
  portfolioId: Id<"portfolios">;
  rating: number;
  feedback: string;
  upvotes: number;
  createdAt: number;
  author: {
    _id: Id<"users">;
    nickname?: string;
    avatarUrl?: string;
    primaryArea?: string;
  };
};

export default function CritiqueCard({
  critiqueId,
  portfolioId,
  rating,
  feedback,
  upvotes,
  createdAt,
  author,
}: CritiqueCardProps) {
  const { isSignedIn, user } = useUser();
  const upvoteMutation = useMutation(api.critiques.mutations.upvote);
  const [localUpvotes, setLocalUpvotes] = useState(upvotes);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const displayName = author.nickname ?? "Anônimo";
  const profileHref = getProfileRoute({ nickname: author.nickname, _id: author._id });

  const handleUpvote = async () => {
    if (!isSignedIn) {
      setShowAuthModal(true);
      return;
    }

    if (isUpvoting) return;
    setIsUpvoting(true);

    // Optimistic update
    setLocalUpvotes((prev) => prev + 1);

    try {
      const result = await upvoteMutation({ critiqueId });
      setLocalUpvotes(result.upvotes);
    } catch {
      // Revert on failure
      setLocalUpvotes((prev) => prev - 1);
    } finally {
      setIsUpvoting(false);
    }
  };

  return (
    <>
      <article className="rounded-lg border p-4 space-y-3">
        {/* Header: avatar, nickname, area, time */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <Link
              href={profileHref as any}
              className="shrink-0"
              aria-label={`Ver perfil de ${displayName}`}
            >
              {author.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt={`Avatar de ${displayName}`}
                  className="h-8 w-8 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>

            {/* Nickname + area */}
            <div className="min-w-0">
              <Link
                href={profileHref as any}
                className="text-sm font-medium hover:underline truncate block"
              >
                @{displayName}
              </Link>
              {author.primaryArea && (
                <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  {author.primaryArea}
                </span>
              )}
            </div>
          </div>

          {/* Time + rating */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <StarDisplay rating={rating} />
            <time
              dateTime={new Date(createdAt).toISOString()}
              className="text-xs text-muted-foreground"
            >
              {relativeTime(createdAt)}
            </time>
          </div>
        </div>

        {/* Feedback text */}
        <p className="text-sm leading-relaxed">{feedback}</p>

        {/* Upvote */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleUpvote}
            disabled={isUpvoting}
            aria-label={`Dar upvote nesta crítica. ${localUpvotes} upvote${localUpvotes !== 1 ? "s" : ""}`}
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">▲</span>
            <span>{localUpvotes}</span>
          </button>
        </div>
      </article>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Entre para continuar"
        description="Faça login para dar upvote nesta crítica."
        redirectTo={`/portfolio/${portfolioId}`}
      />
    </>
  );
}
