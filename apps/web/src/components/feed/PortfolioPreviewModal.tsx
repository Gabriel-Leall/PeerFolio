"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@PeerFolio/backend/convex/_generated/api";
import { cn } from "@PeerFolio/ui/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  ExternalLink,
  Globe,
  Heart,
  Loader2,
  MessageSquare,
  Send,
  Star,
  ThumbsUp,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import AuthModal from "@/components/AuthModal";
import { getProfileRoute } from "@/lib/profile-route";
import type { FeedCardData } from "./FeedCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CritiqueFormState {
  rating: number;
  feedback: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Accessible star-rating picker */
function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Avaliação de 1 a 5 estrelas">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} estrela${star !== 1 ? "s" : ""}`}
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={cn(
            "cursor-pointer transition-transform duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm",
            !disabled && "hover:scale-125",
            disabled && "cursor-default opacity-50"
          )}
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors duration-150",
              star <= active ? "text-amber-400" : "text-muted-foreground/30"
            )}
            fill={star <= active ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

/** Single critique card */
function CritiqueCard({
  critique,
  portfolioAuthorId,
}: {
  critique: {
    _id: string;
    rating: number;
    feedback: string;
    upvotes: number;
    createdAt: number;
    author: {
      _id: string;
      nickname?: string;
      avatarUrl?: string;
      primaryArea?: string;
    };
  };
  portfolioAuthorId: string;
}) {
  const { isSignedIn } = useUser();
  const upvote = useMutation(api.critiques.mutations.upvote);
  const [localUpvotes, setLocalUpvotes] = useState(critique.upvotes);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const name = critique.author.nickname ?? "Anônimo";
  const timeAgo = formatTimeAgo(critique.createdAt);
  const isPortfolioOwner = critique.author._id === portfolioAuthorId;

  const handleUpvote = async () => {
    if (!isSignedIn) { setShowAuth(true); return; }
    if (isUpvoting) return;
    setIsUpvoting(true);
    const prev = localUpvotes;
    setLocalUpvotes((n) => n + 1);
    try {
      const result = await upvote({ critiqueId: critique._id as any });
      setLocalUpvotes(result.upvotes);
    } catch {
      setLocalUpvotes(prev);
    } finally {
      setIsUpvoting(false);
    }
  };

  return (
    <>
      <article className="group flex flex-col gap-3 rounded-lg border border-border/5 bg-surface-container-high p-4 transition-colors hover:border-border/10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {critique.author.avatarUrl ? (
              <img
                src={critique.author.avatarUrl}
                alt={name}
                className="h-7 w-7 shrink-0 rounded-md object-cover"
              />
            ) : (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-[11px] font-bold text-secondary-foreground">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">
                {name}
                {isPortfolioOwner && (
                  <span className="ml-1.5 inline-flex items-center rounded-sm bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-primary">
                    Autor
                  </span>
                )}
              </span>
              {critique.author.primaryArea && (
                <span className="block truncate text-[11px] text-muted-foreground">
                  {critique.author.primaryArea}
                </span>
              )}
            </div>
          </div>

          {/* Rating badge */}
          <div className="flex shrink-0 items-center gap-1 text-xs font-bold text-amber-400">
            <Star className="h-3.5 w-3.5" fill="currentColor" />
            {critique.rating.toFixed(0)}
          </div>
        </div>

        {/* Feedback */}
        <p className="font-sans text-sm leading-relaxed text-foreground/80">
          {critique.feedback}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="font-sans text-[11px] text-muted-foreground/60">
            {timeAgo}
          </span>
          <button
            type="button"
            onClick={handleUpvote}
            disabled={isUpvoting}
            aria-label={`Upvote esta crítica (${localUpvotes} votos)`}
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <ThumbsUp className="h-3 w-3" />
            <span>{localUpvotes}</span>
          </button>
        </div>
      </article>

      <AuthModal
        open={showAuth}
        onOpenChange={setShowAuth}
        title="Entre para votar"
        description="Faça login para dar upvote em críticas."
        redirectTo="/"
      />
    </>
  );
}

/** Critique submission form */
function CritiqueForm({
  portfolioId,
  onSuccess,
}: {
  portfolioId: string;
  onSuccess: () => void;
}) {
  const { isSignedIn } = useUser();
  const submitCritique = useMutation(api.critiques.mutations.submit);
  const [showAuth, setShowAuth] = useState(false);

  const [form, setForm] = useState<CritiqueFormState>({ rating: 0, feedback: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const feedbackLen = form.feedback.trim().length;
  const canSubmit = form.rating > 0 && feedbackLen >= 20 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) { setShowAuth(true); return; }
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitCritique({
        portfolioId: portfolioId as any,
        rating: form.rating,
        feedback: form.feedback.trim(),
      });
      setForm({ rating: 0, feedback: "" });
      onSuccess();
    } catch (err: any) {
      const msg = err?.data ?? err?.message ?? "Erro desconhecido";
      if (msg === "SELF_CRITIQUE_NOT_ALLOWED") {
        setError("Você não pode criticar o seu próprio portfólio.");
      } else if (msg === "ALREADY_CRITIQUED") {
        setError("Você já enviou uma crítica para este portfólio.");
      } else if (msg === "RATE_LIMIT_EXCEEDED") {
        setError("Você atingiu o limite de 5 críticas por hora. Tente mais tarde.");
      } else if (msg === "FEEDBACK_TOO_SHORT") {
        setError("O feedback deve ter pelo menos 20 caracteres.");
      } else {
        setError("Ocorreu um erro ao enviar a crítica. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotSignedIn = () => {
    setShowAuth(true);
  };

  return (
    <>
      <form
        onSubmit={isSignedIn ? handleSubmit : (e) => { e.preventDefault(); handleNotSignedIn(); }}
        className="flex flex-col gap-4 rounded-lg border border-border/5 bg-surface-container p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-sm font-semibold text-foreground">
            Deixar uma crítica
          </h3>
          <StarPicker
            value={form.rating}
            onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
            disabled={isSubmitting}
          />
        </div>

        <textarea
          ref={textareaRef}
          value={form.feedback}
          onChange={(e) => setForm((f) => ({ ...f, feedback: e.target.value }))}
          disabled={isSubmitting}
          rows={3}
          maxLength={1000}
          placeholder="Descreva o que você observou: pontos fortes, áreas a melhorar, impacto visual…"
          aria-label="Texto da crítica"
          className="w-full resize-none rounded-md border border-border/10 bg-surface-container-high px-3 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
        />

        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "font-sans text-[11px]",
              feedbackLen > 900
                ? "text-amber-400"
                : feedbackLen < 20 && feedbackLen > 0
                  ? "text-muted-foreground/50"
                  : "text-muted-foreground/40"
            )}
          >
            {feedbackLen > 0 ? `${feedbackLen}/1000 chars` : "Mín. 20 caracteres"}
          </span>

          {error && (
            <p className="flex-1 text-right font-sans text-xs text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!isSignedIn ? false : !canSubmit}
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              canSubmit || !isSignedIn
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-surface-container-high text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Enviar
          </button>
        </div>
      </form>

      <AuthModal
        open={showAuth}
        onOpenChange={setShowAuth}
        title="Entre para criticar"
        description="Faça login para deixar uma crítica e ajudar a comunidade."
        redirectTo="/"
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

interface PortfolioPreviewModalProps {
  portfolio: FeedCardData | null;
  onClose: () => void;
}

export function PortfolioPreviewModal({
  portfolio,
  onClose,
}: PortfolioPreviewModalProps) {
  // Fetch live critiques — skip for mock portfolios (IDs starting with "mock_")
  const isMock = portfolio?._id?.toString().startsWith("mock_") ?? false;
  const critiques = useQuery(
    api.portfolios.queries.getCritiques,
    portfolio && !isMock ? { portfolioId: portfolio._id } : "skip"
  );

  const [critiqueRefreshKey, setCritiqueRefreshKey] = useState(0);

  // Close on Escape
  useEffect(() => {
    if (!portfolio) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [portfolio, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!portfolio) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [portfolio]);

  if (!portfolio) return null;

  const displayName = portfolio.author.nickname ?? "Anônimo";
  const authorProfileHref = getProfileRoute({
    nickname: portfolio.author.nickname,
    _id: portfolio.authorId,
  });
  const isLoading = critiques === undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Pré-visualização: ${portfolio.title}`}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 pointer-events-none"
      >
        <div
          className={cn(
            "pointer-events-auto",
            "relative flex w-full max-w-3xl flex-col overflow-hidden",
            "rounded-xl border border-border/10 bg-surface-container shadow-2xl",
            "max-h-[92vh]"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar pré-visualização"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border/10 bg-background/70 text-muted-foreground backdrop-blur-sm transition-colors hover:border-border/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <X className="h-4 w-4" />
          </button>

          {/* ---- SCROLLABLE WRAPPER ---- */}
          <div className="overflow-y-auto">
            {/* Hero Image */}
            <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-surface-container-low">
              {portfolio.previewImageUrl ? (
                <img
                  src={portfolio.previewImageUrl}
                  alt={`Preview do portfólio ${portfolio.title}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 to-secondary/10">
                  <Globe className="h-16 w-16 text-muted-foreground/20" />
                </div>
              )}
              {/* Area badge */}
              <span className="absolute left-4 top-4 inline-flex items-center rounded-md bg-background/90 px-2.5 py-1 text-xs font-semibold shadow backdrop-blur-sm">
                {portfolio.area}
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-col p-7 sm:p-8">

              {/* ── Title block ── */}
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  {/* Eyebrow — author */}
                  <div className="mb-2 flex items-center gap-2">
                    {portfolio.author.avatarUrl ? (
                      <img
                        src={portfolio.author.avatarUrl}
                        alt={displayName}
                        className="h-5 w-5 rounded-sm object-cover opacity-80"
                      />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-secondary text-[10px] font-bold text-secondary-foreground">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="font-sans text-xs uppercase tracking-widest text-muted-foreground/60">
                      {displayName}
                    </span>
                  </div>

                  {/* Main title */}
                  <h2 className="font-serif text-3xl font-light leading-tight tracking-tight text-foreground sm:text-4xl">
                    {portfolio.title}
                  </h2>

                  {/* URL pill */}
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground/40 truncate">
                    {portfolio.normalizedUrl}
                  </p>
                </div>

                {/* Stats column */}
                <div className="flex shrink-0 flex-col items-end gap-2 pt-1">
                  {portfolio.averageRating > 0 && (
                    <div
                      className="flex items-center gap-1 text-sm font-bold text-amber-400"
                      title={`Média: ${portfolio.averageRating.toFixed(1)} estrelas`}
                    >
                      <Star className="h-4 w-4" fill="currentColor" />
                      {portfolio.averageRating.toFixed(1)}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground/50" title="Críticas">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {critiques?.length ?? portfolio.critiqueCount}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground/50" title="Curtidas">
                    <Heart className="h-3.5 w-3.5" />
                    {portfolio.likeCount}
                  </div>
                </div>
              </div>

              {/* ── Stack tags — read-only, outline-only pills ── */}
              {portfolio.stack.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {portfolio.stack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center rounded-full border border-border/20 px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground/50 select-none"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {/* ── Goals / Description ── */}
              {portfolio.goalsContext && (
                <p className="mt-6 border-l-2 border-primary/20 pl-4 font-sans text-sm leading-relaxed text-muted-foreground">
                  {portfolio.goalsContext}
                </p>
              )}

              {/* ── CTAs ── */}
              <div className="mt-8 flex items-center gap-3">
                <a
                  href={portfolio.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visitar Site
                </a>
                <Link
                  href={authorProfileHref as any}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border/15 px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <User className="h-4 w-4" />
                  Ver Perfil do Autor
                </Link>
              </div>

              {/* ── Critiques Section ── */}
              <section aria-label="Críticas da comunidade" className="mt-10 border-t border-border/8 pt-8">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-serif text-xl font-light text-foreground">
                    Críticas da Comunidade
                    {critiques && critiques.length > 0 && (
                      <span className="ml-2 font-sans text-sm font-normal text-muted-foreground/50">
                        ({critiques.length})
                      </span>
                    )}
                  </h3>
                </div>

                {/* Form */}
                <CritiqueForm
                  portfolioId={portfolio._id}
                  onSuccess={() => setCritiqueRefreshKey((k) => k + 1)}
                />

                {/* List */}
                <div className="mt-5 flex flex-col gap-3">
                  {isLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
                    </div>
                  )}

                  {!isLoading && critiques.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/10 py-10 text-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/20" />
                      <p className="font-sans text-sm text-muted-foreground/60">
                        Nenhuma crítica ainda. Seja o primeiro!
                      </p>
                    </div>
                  )}

                  {!isLoading &&
                    critiques.map((critique) => (
                      <CritiqueCard
                        key={`${critique._id}-${critiqueRefreshKey}`}
                        critique={critique}
                        portfolioAuthorId={portfolio.authorId}
                      />
                    ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `há ${weeks} sem`;
  const months = Math.floor(days / 30);
  return `há ${months} mes${months !== 1 ? "es" : ""}`;
}
