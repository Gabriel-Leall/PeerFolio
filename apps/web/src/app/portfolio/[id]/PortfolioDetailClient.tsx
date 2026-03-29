"use client";

import { api } from "@peerFolio/backend/convex/_generated/api";
import type { Id } from "@peerFolio/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import {
  Camera,
  ExternalLink,
  Lightbulb,
  MessageSquare,
  Share2,
  Sparkles,
  Star,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import CritiqueCard from "@/components/CritiqueCard";
import { getProfileRoute } from "@/lib/profile-route";
import CritiqueForm from "./CritiqueForm";

// ---------------------------------------------------------------------------
// Area badge
// ---------------------------------------------------------------------------

function AreaBadge({ area }: { area: string }) {
  return (
    <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
      {area}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Large average rating display
// ---------------------------------------------------------------------------

function AverageRatingDisplay({
  average,
  count,
}: {
  average: number;
  count: number;
}) {
  const rounded = Math.round(average * 10) / 10;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
        <span className="text-3xl font-bold">{count > 0 ? rounded.toFixed(1) : "—"}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {count} {count === 1 ? "crítica" : "críticas"}
        </span>
        <span className="text-xs text-muted-foreground">Avaliação média</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Author card
// ---------------------------------------------------------------------------

function AuthorCard({
  author,
}: {
  author: {
    _id: Id<"users">;
    nickname?: string;
    avatarUrl?: string;
    primaryArea?: string;
  };
}) {
  const displayName = author.nickname ?? "Anônimo";
  const profileHref = getProfileRoute({ nickname: author.nickname, _id: author._id });

  return (
    <Link
      href={profileHref as any}
      className="group inline-flex items-center gap-3 rounded-lg border bg-card px-3 py-2 transition-all hover:border-[#a762b5]/30 hover:shadow-md hover:shadow-[#a762b5]/5"
    >
      {author.avatarUrl ? (
        <img
          src={author.avatarUrl}
          alt={`Avatar de ${displayName}`}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-background transition group-hover:ring-[#a762b5]/30"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium group-hover:text-[#a762b5] transition-colors">
          @{displayName}
        </span>
        {author.primaryArea && (
          <span className="text-xs text-muted-foreground">{author.primaryArea}</span>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Share button
// ---------------------------------------------------------------------------

function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium transition-all hover:bg-muted hover:border-[#a762b5]/30 cursor-pointer"
    >
      <Share2 className="h-4 w-4" />
      {copied ? "Copiado!" : "Compartilhar"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Visit site CTA
// ---------------------------------------------------------------------------

function VisitSiteButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-[#a762b5] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#a762b5]/90 hover:shadow-lg hover:shadow-[#a762b5]/25 cursor-pointer"
    >
      <ExternalLink className="h-4 w-4" />
      Visitar Site
    </a>
  );
}

function formatRetryTime(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${Math.max(1, minutes)}min`;
}

function RefreshPreviewButton({
  portfolioId,
  isOwner,
}: {
  portfolioId: Id<"portfolios">;
  isOwner: boolean;
}) {
  const refreshPreview = useMutation(api.portfolios.mutations.refreshPreview);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOwner) return null;

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setMessage(null);
    try {
      const result = await refreshPreview({ portfolioId });
      if (result.status === "cooldown") {
        const retryAfter = result.retryAfterMs ?? 0;
        setMessage(
          `Você poderá atualizar novamente em ${formatRetryTime(retryAfter)}.`,
        );
      } else {
        setMessage("Preview em atualização. Recarregue em instantes.");
      }
    } catch {
      setMessage("Não foi possível atualizar o preview agora.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium transition-all hover:bg-muted hover:border-[#a762b5]/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRefreshing ? "Atualizando..." : "Atualizar preview"}
      </button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview section with device frame
// ---------------------------------------------------------------------------

function PreviewSection({
  previewImageUrl,
  title,
  url,
  normalizedUrl,
}: {
  previewImageUrl?: string;
  title: string;
  url: string;
  normalizedUrl: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (!previewImageUrl) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 md:p-8">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${title} em nova aba`}
          className="flex min-h-60 flex-col items-center justify-center gap-4 transition hover:opacity-80 md:min-h-80"
        >
          <div className="rounded-full bg-secondary/50 p-4">
            <ExternalLink className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium break-all px-4">{normalizedUrl}</p>
            <p className="text-xs text-muted-foreground">Clique para abrir o site</p>
          </div>
        </a>
      </div>
    );
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Device frame mockup - CSS only */}
      <div className="relative rounded-2xl border-4 border-foreground/10 bg-foreground/5 p-2 shadow-2xl shadow-black/10 transition-transform duration-300 group-hover:scale-[1.02] dark:border-white/10 dark:bg-white/5">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-foreground/10 px-3 py-2 mb-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400/60" />
            <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
            <div className="h-3 w-3 rounded-full bg-green-400/60" />
          </div>
          <div className="flex-1 mx-4">
            <div className="rounded-md bg-foreground/10 px-3 py-1 text-xs text-muted-foreground truncate">
              {normalizedUrl}
            </div>
          </div>
        </div>

        {/* Screenshot */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${title} em nova aba`}
          className="block overflow-hidden rounded-lg"
        >
          <img
            src={previewImageUrl}
            alt={`Preview de ${title}`}
            className="w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </a>
      </div>

      {/* Screenshot badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-sm">
        <Camera className="h-3 w-3" />
        Screenshot
      </div>

      {/* Hover overlay hint */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
          <ExternalLink className="h-4 w-4" />
          Ver site
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stack display
// ---------------------------------------------------------------------------

function StackDisplay({ stack }: { stack: string[] }) {
  if (stack.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <TrendingUp className="h-4 w-4 text-[#a762b5]" />
        Stack Tecnológicas
      </h3>
      <div className="flex flex-wrap gap-2">
        {stack.map((tag) => (
          <span
            key={tag}
            className="rounded-lg border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-[#a762b5]/30 hover:text-[#a762b5]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feedback request highlight
// ---------------------------------------------------------------------------

function FeedbackRequestSection({ goalsContext }: { goalsContext: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#a762b5]/20 bg-linear-to-br from-[#a762b5]/5 to-[#a762b5]/10 p-5">
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <Lightbulb className="h-16 w-16 text-[#a762b5]" />
      </div>
      <div className="relative">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#a762b5]">
          <Sparkles className="h-4 w-4" />
          SOLICITAÇÃO DE FEEDBACK
        </h3>
        <p className="text-sm leading-relaxed text-foreground/80">{goalsContext}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Enhanced critique section
// ---------------------------------------------------------------------------

function CritiquesSection({
  portfolioId,
  isOwner,
  critiqueFormRef,
}: {
  portfolioId: Id<"portfolios">;
  isOwner: boolean;
  critiqueFormRef: React.RefObject<HTMLElement | null>;
}) {
  const critiques = useQuery(api.portfolios.queries.getCritiques, { portfolioId });

  if (critiques === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl border bg-muted/30" />
        ))}
      </div>
    );
  }

  if (critiques.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <MessageSquare className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {isOwner
              ? "Nenhuma crítica ainda. Compartilhe para receber feedback!"
              : "Este portfólio ainda não tem críticas."}
          </p>
          <p className="text-xs text-muted-foreground">
            {isOwner
              ? "Sua primeira crítica aparecerá aqui."
              : "Seja o primeiro a deixar uma crítica construtiva."}
          </p>
        </div>
        {!isOwner && (
          <button
            type="button"
            onClick={() => {
              critiqueFormRef.current?.scrollIntoView({ behavior: "smooth" });
              setTimeout(() => {
                (
                  critiqueFormRef.current?.querySelector("textarea") as HTMLTextAreaElement | null
                )?.focus();
              }, 500);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#a762b5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a762b5]/90 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Deixar primeira crítica
          </button>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            Copiar link
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {critiques.map((critique: (typeof critiques)[number]) => (
        <CritiqueCard
          key={critique._id}
          critiqueId={critique._id}
          portfolioId={portfolioId}
          rating={critique.rating}
          feedback={critique.feedback}
          upvotes={critique.upvotes}
          createdAt={critique.createdAt}
          author={critique.author}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Related portfolios section
// ---------------------------------------------------------------------------

function RelatedPortfoliosSection({
  currentPortfolioId,
  area,
}: {
  currentPortfolioId: Id<"portfolios">;
  area: string | undefined;
}) {
  const relatedPortfolios = useQuery(api.portfolios.queries.list, {
    filter: "latest",
    area: area as "Frontend" | "Backend" | "Fullstack" | "UI/UX" | "Mobile" | "Other" | undefined,
    paginationOpts: {
      numItems: 5,
      cursor: null,
    },
  });

  const portfolios = relatedPortfolios?.page;
  if (!portfolios || portfolios.length <= 1) {
    return null;
  }

  const filtered = portfolios
    .filter((p) => p._id !== currentPortfolioId)
    .slice(0, 3);

  if (filtered.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <ThumbsUp className="h-4 w-4 text-[#a762b5]" />
        Você também pode gostar
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((portfolio) => (
          <Link
            key={portfolio._id}
            href={`/portfolio/${portfolio._id}`}
            className="group relative overflow-hidden rounded-xl border bg-card p-3 transition-all hover:border-[#a762b5]/30 hover:shadow-lg hover:shadow-[#a762b5]/5"
          >
            {portfolio.previewImageUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={portfolio.previewImageUrl}
                  alt={portfolio.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="aspect-video w-full flex items-center justify-center rounded-lg bg-muted">
                <ExternalLink className="h-6 w-6 text-muted-foreground/40" />
              </div>
            )}
            <div className="mt-3 space-y-1">
              <h4 className="line-clamp-1 text-sm font-semibold group-hover:text-[#a762b5] transition-colors">
                {portfolio.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-amber-400">★</span>
                <span>
                  {portfolio.averageRating > 0 ? portfolio.averageRating.toFixed(1) : "—"}
                </span>
                <span>·</span>
                <span>{portfolio.critiqueCount} críticas</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page client component
// ---------------------------------------------------------------------------

type PortfolioDetailClientProps = {
  portfolioId: Id<"portfolios">;
};

export default function PortfolioDetailClient({ portfolioId }: PortfolioDetailClientProps) {
  const me = useQuery(api.users.queries.getMe);
  const portfolio = useQuery(api.portfolios.queries.getById, { portfolioId });
  const critiqueFormRef = useRef<HTMLElement | null>(null);

  if (portfolio === undefined) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            <div className="h-80 animate-pulse rounded-2xl border bg-muted/30" />
            <div className="h-32 animate-pulse rounded-xl border bg-muted/30" />
          </div>
          <div className="space-y-6">
            <div className="h-48 animate-pulse rounded-xl border bg-muted/30" />
            <div className="h-64 animate-pulse rounded-xl border bg-muted/30" />
          </div>
        </div>
      </div>
    );
  }

  if (portfolio === null) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-semibold">Portfólio não encontrado</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Este portfólio não existe ou foi removido pelo autor.
        </p>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-lg border px-4 text-sm font-medium transition hover:bg-muted"
        >
          Voltar ao feed
        </Link>
      </div>
    );
  }

  const isOwner = me !== undefined && me !== null && me._id === portfolio.author._id;

  const showOfflineBadge =
    portfolio.urlStatus === "offline" && (portfolio.consecutiveOfflineCount ?? 0) >= 3;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      {/* Enhanced Header */}
      <header className="mb-8 space-y-6">
        {/* Top row: Title and actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              <span className="bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {portfolio.title}
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <AreaBadge area={portfolio.area} />
              {showOfflineBadge && (
                <span
                  role="status"
                  aria-label="Site pode estar fora do ar"
                  className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  Site pode estar offline
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <ShareButton />
            <RefreshPreviewButton portfolioId={portfolioId} isOwner={isOwner} />
            <VisitSiteButton url={portfolio.url} />
          </div>
        </div>

        {/* Author and rating row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AuthorCard author={portfolio.author} />
          <AverageRatingDisplay
            average={portfolio.averageRating}
            count={portfolio.critiqueCount}
          />
        </div>
      </header>

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        {/* Left column: preview + metadata */}
        <section className="space-y-6">
          {/* Preview */}
          <PreviewSection
            previewImageUrl={portfolio.previewImageUrl}
            title={portfolio.title}
            url={portfolio.url}
            normalizedUrl={portfolio.normalizedUrl}
          />

          {/* Stack */}
          {portfolio.stack.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <StackDisplay stack={portfolio.stack} />
            </div>
          )}

          {/* Related portfolios */}
          <div className="rounded-xl border bg-card p-5">
            <RelatedPortfoliosSection
              currentPortfolioId={portfolioId}
              area={portfolio.area}
            />
          </div>
        </section>

        {/* Right column: feedback request + form + critiques */}
        <aside className="space-y-6">
          {/* Goals context (feedback request) */}
          {portfolio.goalsContext && (
            <FeedbackRequestSection goalsContext={portfolio.goalsContext} />
          )}

          {/* Critique form */}
          <div
            ref={critiqueFormRef as React.RefObject<HTMLDivElement>}
            className="rounded-xl border bg-card p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#a762b5]" />
              <h2 className="text-base font-semibold">Deixe sua Crítica</h2>
            </div>
            {!isOwner && (
              <p className="mb-4 text-xs text-muted-foreground">
                Ajude este desenvolvedor a melhorar com seu feedback construtivo.
              </p>
            )}
            <CritiqueForm
              portfolioId={portfolioId}
              portfolioUrl={portfolio.url}
              isOwner={isOwner}
            />
          </div>

          {/* Community Critiques */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <MessageSquare className="h-5 w-5 text-[#a762b5]" />
                {portfolio.critiqueCount > 0
                  ? `Críticas da Comunidade`
                  : "Críticas da Comunidade"}
              </h2>
              {portfolio.critiqueCount > 0 && (
                <span className="rounded-full bg-[#a762b5]/10 px-2.5 py-0.5 text-xs font-medium text-[#a762b5]">
                  {portfolio.critiqueCount}
                </span>
              )}
            </div>
            <CritiquesSection
              portfolioId={portfolioId}
              isOwner={isOwner}
              critiqueFormRef={critiqueFormRef}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
