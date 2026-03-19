"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@PeerFolio/backend/convex/_generated/api";
import type { Id } from "@PeerFolio/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useRef } from "react";

import CritiqueCard from "@/components/CritiqueCard";
import CritiqueForm from "./CritiqueForm";

// ---------------------------------------------------------------------------
// Area badge
// ---------------------------------------------------------------------------

function AreaBadge({ area }: { area: string }) {
  return (
    <span className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
      {area}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Star average display
// ---------------------------------------------------------------------------

function AverageRating({ average, count }: { average: number; count: number }) {
  const rounded = Math.round(average * 10) / 10;
  return (
    <div className="flex items-center gap-1.5" aria-label={`Avaliação média: ${rounded} de 5`}>
      <span className="text-amber-400">★</span>
      <span className="text-sm font-medium">{count > 0 ? rounded.toFixed(1) : "—"}</span>
      <span className="text-xs text-muted-foreground">
        ({count} {count === 1 ? "crítica" : "críticas"})
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Critiques section with empty state (T021)
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
  const critiques = useQuery(api["portfolios/queries"].getCritiques, { portfolioId });

  if (critiques === undefined) {
    // Loading skeleton
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg border bg-muted/30" />
        ))}
      </div>
    );
  }

  if (critiques.length === 0) {
    // Empty state — T021
    return (
      <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          {isOwner
            ? "Compartilhe seu portfólio para receber críticas."
            : "Nenhuma crítica ainda. Seja o primeiro."}
        </p>
        {!isOwner && (
          <button
            type="button"
            onClick={() => {
              critiqueFormRef.current?.scrollIntoView({ behavior: "smooth" });
              (critiqueFormRef.current?.querySelector("textarea") as HTMLTextAreaElement | null)?.focus();
            }}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition hover:bg-muted"
          >
            Deixar uma crítica ↓
          </button>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition hover:bg-muted"
          >
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
// Main page client component
// ---------------------------------------------------------------------------

type PortfolioDetailClientProps = {
  portfolioId: Id<"portfolios">;
};

export default function PortfolioDetailClient({ portfolioId }: PortfolioDetailClientProps) {
  const { user } = useUser();
  const portfolio = useQuery(api["portfolios/queries"].getById, { portfolioId });
  const critiqueFormRef = useRef<HTMLElement | null>(null);

  // Loading
  if (portfolio === undefined) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            <div className="h-72 animate-pulse rounded-lg border bg-muted/30" />
            <div className="h-28 animate-pulse rounded-lg border bg-muted/30" />
          </div>
          <div className="space-y-6">
            <div className="h-44 animate-pulse rounded-lg border bg-muted/30" />
            <div className="h-56 animate-pulse rounded-lg border bg-muted/30" />
          </div>
        </div>
      </div>
    );
  }

  // Not found / deleted
  if (portfolio === null) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">Portfólio não encontrado</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Este portfólio não existe ou foi removido pelo autor.
        </p>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-md border px-4 text-sm transition hover:bg-muted"
        >
          Voltar ao feed
        </Link>
      </div>
    );
  }

  // Determine if viewer is owner
  // We compare Clerk user ID with portfolio author's clerkId via the author record
  // Since portfolio.author._id is the Convex user ID, we check it after user sync
  // For now, we do a best-effort check via the Clerk user's externalId or the author nickname match.
  // Full owner check requires Convex identity — we'll refine once users.getMe query exists.
  const isOwner = false; // Simplified — will be wired properly once getMe is available

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      {/* Page title */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold md:text-3xl">{portfolio.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <AreaBadge area={portfolio.area} />
          <AverageRating average={portfolio.averageRating} count={portfolio.critiqueCount} />
          <span className="text-xs text-muted-foreground">
            por{" "}
            <a
              href={`/dashboard/${portfolio.author._id}`}
              className="font-medium hover:underline"
            >
              @{portfolio.author.nickname ?? "Anônimo"}
            </a>
          </span>
        </div>
      </header>

      {/* Two-column layout (60/40 on desktop, stacked on mobile) */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Left column: preview + metadata */}
        <section className="space-y-6">
          {/* Preview */}
          <article className="rounded-lg border p-4 md:p-5">
            <h2 className="mb-3 text-base font-semibold">Preview</h2>
            {portfolio.previewImageUrl ? (
              <img
                src={portfolio.previewImageUrl}
                alt={`Preview de ${portfolio.title}`}
                className="w-full rounded-md object-cover"
                loading="lazy"
              />
            ) : (
              /* Gradient fallback */
              <a
                href={portfolio.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir ${portfolio.title} em nova aba`}
                className="flex min-h-60 items-center justify-center rounded-md bg-linear-to-br from-muted to-muted/50 transition hover:opacity-80 md:min-h-80"
              >
                <div className="text-center space-y-2">
                  <span className="text-4xl" aria-hidden="true">🌐</span>
                  <p className="text-sm text-muted-foreground break-all px-4">
                    {portfolio.normalizedUrl}
                  </p>
                  <p className="text-xs text-muted-foreground">Clique para abrir</p>
                </div>
              </a>
            )}
          </article>

          {/* Stack */}
          {portfolio.stack.length > 0 && (
            <article className="rounded-lg border p-4 md:p-5">
              <h2 className="mb-3 text-base font-semibold">Stack</h2>
              <div className="flex flex-wrap gap-2">
                {portfolio.stack.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          )}
        </section>

        {/* Right column: feedback request + form + critiques */}
        <aside className="space-y-6">
          {/* Goals context (feedback request) — shown only if set */}
          {portfolio.goalsContext && (
            <article className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 md:p-5">
              <h2 className="mb-2 flex items-center gap-2 text-base font-semibold">
                <span aria-hidden="true">⚙</span> FEEDBACK REQUEST
              </h2>
              <p className="text-sm leading-relaxed text-foreground/80">{portfolio.goalsContext}</p>
            </article>
          )}

          {/* Critique form — T018 */}
          <article ref={critiqueFormRef as React.RefObject<HTMLElement>} className="rounded-lg border p-4 md:p-5">
            <h2 className="mb-4 text-base font-semibold">Deixar Crítica</h2>
            <CritiqueForm
              portfolioId={portfolioId}
              portfolioUrl={portfolio.url}
              isOwner={isOwner}
            />
          </article>

          {/* Community Critiques — T021 */}
          <article className="rounded-lg border p-4 md:p-5">
            <h2 className="mb-4 text-base font-semibold">
              {portfolio.critiqueCount > 0
                ? `Críticas da Comunidade (${portfolio.critiqueCount})`
                : "Críticas da Comunidade"}
            </h2>
            <CritiquesSection
              portfolioId={portfolioId}
              isOwner={isOwner}
              critiqueFormRef={critiqueFormRef}
            />
          </article>
        </aside>
      </div>
    </main>
  );
}
