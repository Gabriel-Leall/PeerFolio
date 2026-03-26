"use client";

import { api } from "@PeerFolio/backend/convex/_generated/api";
import { Button } from "@PeerFolio/ui/components/button";
import { usePaginatedQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { FeedCard, FeedCardSkeleton } from "@/components/feed/FeedCard";
import type { FeedCardData } from "@/components/feed/FeedCard";
import { FeedCategoryPills } from "@/components/feed/FeedCategoryPills";
import type { CategoryValue } from "@/components/feed/FeedCategoryPills";
import { FeedHero } from "@/components/feed/FeedHero";
import { PortfolioPreviewModal } from "@/components/feed/PortfolioPreviewModal";
import { FeedTabs, type FeedFilter } from "@/components/FeedTabs";

// ---------------------------------------------------------------------------
// Mock data — rendered when the database has no real portfolios yet
// Allows visual QA and full modal testing without seeding the DB.
// ---------------------------------------------------------------------------

const MOCK_PORTFOLIOS: FeedCardData[] = [
  {
    _id: "mock_001" as any,
    _creationTime: Date.now() - 86400000 * 2,
    url: "https://example.com/silhouettes",
    normalizedUrl: "example.com/silhouettes",
    title: "Silhouettes of Noir",
    area: "UI/UX",
    stack: ["Figma", "After Effects", "Three.js"],
    goalsContext:
      "Uma exploração visual de formas geométricas em movimento, combinando modelagem 3D com identidade visual editorial. O objetivo era criar uma marca que tivesse presença tanto no digital quanto no impresso.",
    previewImageUrl:
      "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&q=80",
    averageRating: 4.9,
    critiqueCount: 12,
    likeCount: 1300,
    topRatedScore: 8.7,
    lastCritiqueAt: Date.now() - 3600000,
    isDeleted: false,
    createdAt: Date.now() - 86400000 * 2,
    authorId: "user_mock_1" as any,
    hasLiked: false,
    urlStatus: "online",
    author: {
      _id: "user_mock_1" as any,
      nickname: "Elena Rostova",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108755-2616b612b567?w=100&q=80",
      primaryArea: "Motion Designer",
    },
  },
  {
    _id: "mock_002" as any,
    _creationTime: Date.now() - 86400000 * 5,
    url: "https://example.com/liquid-motion",
    normalizedUrl: "example.com/liquid-motion",
    title: "Liquid Motion",
    area: "Frontend",
    stack: ["React", "GSAP", "WebGL", "TypeScript"],
    goalsContext:
      "Portfólio demonstrando animações fluidas e transições de página cinematográficas. Cada projeto tem sua própria identidade visual e sistema de cores.",
    previewImageUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    averageRating: 4.8,
    critiqueCount: 8,
    likeCount: 856,
    topRatedScore: 7.9,
    lastCritiqueAt: Date.now() - 7200000,
    isDeleted: false,
    createdAt: Date.now() - 86400000 * 5,
    authorId: "user_mock_2" as any,
    hasLiked: true,
    urlStatus: "online",
    author: {
      _id: "user_mock_2" as any,
      nickname: "Marcus Thorne",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
      primaryArea: "Frontend Engineer",
    },
  },
  {
    _id: "mock_003" as any,
    _creationTime: Date.now() - 86400000 * 1,
    url: "https://example.com/archivist",
    normalizedUrl: "example.com/archivist",
    title: "The Archivist",
    area: "UI/UX",
    stack: ["Figma", "Framer", "Spline"],
    goalsContext:
      "Redesign de um museu de arquitetura histórica focando em acessibilidade e experiência imersiva. Inclui tour virtual 3D e sistema de curadoria editorial.",
    previewImageUrl:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
    averageRating: 5.0,
    critiqueCount: 24,
    likeCount: 2400,
    topRatedScore: 9.8,
    lastCritiqueAt: Date.now() - 1800000,
    isDeleted: false,
    createdAt: Date.now() - 86400000,
    authorId: "user_mock_3" as any,
    hasLiked: false,
    urlStatus: "online",
    author: {
      _id: "user_mock_3" as any,
      nickname: "Studio Orion",
      primaryArea: "Design Studio",
    },
  },
  {
    _id: "mock_004" as any,
    _creationTime: Date.now() - 86400000 * 8,
    url: "https://example.com/prism-pulse",
    normalizedUrl: "example.com/prism-pulse",
    title: "Prism & Pulse",
    area: "Frontend",
    stack: ["Next.js", "Three.js", "Tailwind", "Prisma"],
    goalsContext:
      "Dashboard de métricas em tempo real com visualizações de dados interativas e modo escuro refinado. Performance otimizada com SSR e streaming.",
    previewImageUrl:
      "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80",
    averageRating: 4.7,
    critiqueCount: 6,
    likeCount: 642,
    topRatedScore: 7.1,
    lastCritiqueAt: Date.now() - 43200000,
    isDeleted: false,
    createdAt: Date.now() - 86400000 * 8,
    authorId: "user_mock_4" as any,
    hasLiked: false,
    urlStatus: "online",
    author: {
      _id: "user_mock_4" as any,
      nickname: "Julian Voss",
      primaryArea: "Fullstack Dev",
    },
  },
  {
    _id: "mock_005" as any,
    _creationTime: Date.now() - 86400000 * 3,
    url: "https://example.com/velvet-horizon",
    normalizedUrl: "example.com/velvet-horizon",
    title: "Velvet Horizon",
    area: "UI/UX",
    stack: ["Figma", "Principle", "Lottie"],
    goalsContext:
      "Sistema de design completo para um app de bem-estar mental. Inclui biblioteca de componentes com 80+ peças, tokens de design e guia de voz e tom.",
    previewImageUrl:
      "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=800&q=80",
    averageRating: 4.9,
    critiqueCount: 18,
    likeCount: 1800,
    topRatedScore: 9.1,
    lastCritiqueAt: Date.now() - 5400000,
    isDeleted: false,
    createdAt: Date.now() - 86400000 * 3,
    authorId: "user_mock_5" as any,
    hasLiked: true,
    urlStatus: "online",
    author: {
      _id: "user_mock_5" as any,
      nickname: "Lia Chen",
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
      primaryArea: "Product Designer",
    },
  },
  {
    _id: "mock_006" as any,
    _creationTime: Date.now() - 86400000 * 12,
    url: "https://example.com/desk-ethos",
    normalizedUrl: "example.com/desk-ethos",
    title: "Desk Ethos",
    area: "UI/UX",
    stack: ["Webflow", "GSAP", "Figma"],
    goalsContext:
      "Branding e site para um estúdio de móveis autorais. Identidade visual minimalista com fotografia de produto profissional e e-commerce integrado.",
    previewImageUrl:
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80",
    averageRating: 4.6,
    critiqueCount: 11,
    likeCount: 412,
    topRatedScore: 7.4,
    lastCritiqueAt: Date.now() - 86400000,
    isDeleted: false,
    createdAt: Date.now() - 86400000 * 12,
    authorId: "user_mock_6" as any,
    hasLiked: false,
    urlStatus: "online",
    author: {
      _id: "user_mock_6" as any,
      nickname: "Archi-Tech Collective",
      primaryArea: "Branding",
    },
  },
];

// ---------------------------------------------------------------------------
// Feed Page
// ---------------------------------------------------------------------------

export default function FeedPage() {
  const [currentFilter, setCurrentFilter] = useState<FeedFilter>("latest");
  const [selectedArea, setSelectedArea] = useState<CategoryValue>(undefined);
  const [previewPortfolio, setPreviewPortfolio] =
    useState<FeedCardData | null>(null);

  const { results, status, loadMore } = usePaginatedQuery(
    api.portfolios.queries.list,
    { filter: currentFilter, area: selectedArea },
    { initialNumItems: 12 }
  );

  const isFirstLoad = status === "LoadingFirstPage";
  const isLoadingMore = status === "LoadingMore";
  const canLoadMore = status === "CanLoadMore";
  const hasResults = results && results.length > 0;
  const isExhausted = status === "Exhausted";

  // Show mock data when the DB is empty and no area filter is active.
  // This lets designers / reviewers validate the layout without seeding the DB.
  const showMocks = isExhausted && !hasResults && !selectedArea;
  const displayItems: FeedCardData[] = hasResults
    ? (results as unknown as FeedCardData[])
    : showMocks
      ? MOCK_PORTFOLIOS
      : [];

  return (
    <div className="min-h-screen">
      {/* ------------------------------------------------------------------ */}
      {/* Page Header + Hero                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-b border-border/5 bg-surface-container-low/40">
        <div className="container mx-auto max-w-7xl px-4 pt-12 pb-10">
          <FeedHero />

          <FeedCategoryPills
            selected={selectedArea}
            onSelect={setSelectedArea}
            className="mt-6"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Sticky Sort Tabs                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="sticky top-0 z-30 border-b border-border/5 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl px-4">
          <FeedTabs
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Content Grid                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="container mx-auto max-w-7xl px-4 py-10">

        {/* Mock banner — only shown when displaying demo data */}
        {showMocks && (
          <div className="mb-8 flex items-center gap-2.5 rounded-md border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-primary/70">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
            <span>
              <strong className="font-semibold text-primary">Modo visualização</strong>
              {" "}— Estes são dados de demonstração. Submeta um portfólio para ver os dados reais.
            </span>
          </div>
        )}

        {/* Grid */}
        {(displayItems.length > 0 || isFirstLoad) && (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {displayItems.map((portfolio, idx) => (
              <div
                key={portfolio._id}
                className={
                  idx % 3 === 1
                    ? "sm:mt-12"
                    : idx % 3 === 2
                      ? "lg:mt-6"
                      : ""
                }
              >
                <FeedCard
                  portfolio={portfolio}
                  onOpenModal={(p) => setPreviewPortfolio(p)}
                />
              </div>
            ))}

            {/* Skeleton placeholders on first load */}
            {isFirstLoad &&
              Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className={i % 3 === 1 ? "sm:mt-12" : ""}
                >
                  <FeedCardSkeleton />
                </div>
              ))}

            {isLoadingMore &&
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`more-skeleton-${i}`}
                  className={i % 3 === 1 ? "sm:mt-12" : ""}
                >
                  <FeedCardSkeleton />
                </div>
              ))}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Load More                                                          */}
        {/* ---------------------------------------------------------------- */}
        {(canLoadMore || isLoadingMore) && hasResults && (
          <div className="mt-16 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => loadMore(12)}
              disabled={isLoadingMore}
              className="min-w-48"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                "Carregar mais"
              )}
            </Button>
          </div>
        )}

        {/* Loading dots */}
        {isLoadingMore && (
          <div className="mt-10 flex justify-center">
            <div className="flex items-center gap-2 text-muted-foreground/40">
              <span className="h-1.5 w-1.5 animate-pulse rounded-sm bg-primary" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-sm bg-primary [animation-delay:200ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-sm bg-primary [animation-delay:400ms]" />
              <span className="ml-2 font-sans text-[11px] uppercase tracking-widest">
                Carregando mais obras
              </span>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Empty State — only when a filter is active but returns nothing    */}
        {/* ---------------------------------------------------------------- */}
        {isExhausted && !hasResults && selectedArea && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-serif text-xl text-foreground mb-2">
              Nenhum portfólio encontrado
            </p>
            <p className="max-w-sm font-sans text-sm text-muted-foreground leading-relaxed">
              Não há portfólios nessa área ainda. Tente outro filtro.
            </p>
            <Button
              variant="outline"
              className="mt-8"
              onClick={() => {
                setSelectedArea(undefined);
                setCurrentFilter("latest");
              }}
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Portfolio Preview Modal                                              */}
      {/* ------------------------------------------------------------------ */}
      <PortfolioPreviewModal
        portfolio={previewPortfolio}
        onClose={() => setPreviewPortfolio(null)}
      />
    </div>
  );
}
