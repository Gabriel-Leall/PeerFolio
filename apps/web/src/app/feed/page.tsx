"use client";

import { api } from "@PeerFolio/backend/convex/_generated/api";
import { Button } from "@PeerFolio/ui/components/button";
import { usePaginatedQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { FeedCard, FeedCardSkeleton } from "@/components/feed/FeedCard";
import type { FeedCardData } from "@/components/feed/FeedCard";
import { PortfolioPreviewModal } from "@/components/feed/PortfolioPreviewModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@PeerFolio/ui/components/dropdown-menu";
import { cn } from "@PeerFolio/ui/lib/utils";

// ---------------------------------------------------------------------------
// Constants for Inline Filters
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { label: "todos os tópicos", value: undefined },
  { label: "Frontend", value: "Frontend" },
  { label: "Backend", value: "Backend" },
  { label: "Fullstack", value: "Fullstack" },
  { label: "UI/UX", value: "UI/UX" },
  { label: "Mobile", value: "Mobile" },
  { label: "Outros", value: "Other" },
] as const;

const FILTERS = [
  { label: "recentes", value: "latest" },
  { label: "melhores avaliados", value: "topRated" },
] as const;

const FEEDBACK_POSITIONS = [11, 47, 59];

type FeedFilter = "latest" | "topRated";
type CategoryValue =
  | "Frontend"
  | "Backend"
  | "Fullstack"
  | "UI/UX"
  | "Mobile"
  | "Other"
  | undefined;

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
  const [previewPortfolio, setPreviewPortfolio] = useState<FeedCardData | null>(
    null,
  );

  const { results, status, loadMore } = usePaginatedQuery(
    api.portfolios.queries.list,
    { filter: currentFilter, area: selectedArea },
    { initialNumItems: 12 },
  );

  const isFirstLoad = status === "LoadingFirstPage";
  const isLoadingMore = status === "LoadingMore";
  const canLoadMore = status === "CanLoadMore";
  const hasResults = results && results.length > 0;
  const isExhausted = status === "Exhausted";

  const showMocks = isExhausted && !hasResults && !selectedArea;
  const displayItems: FeedCardData[] = hasResults
    ? (results as unknown as FeedCardData[])
    : showMocks
      ? MOCK_PORTFOLIOS
      : [];

  const isFeedbackPosition = (idx: number) => FEEDBACK_POSITIONS.includes(idx);

  const getFeedbackCard = (position: number) => {
    return (
      <div
        key={`feedback-${position}`}
        className={`relative flex flex-col items-center justify-center p-8 rounded-2xl bg-[#0a0a0a] border border-white/5 min-h-[320px] lg:min-h-[380px] ${
          position % 3 === 1 ? "sm:mt-12" : position % 3 === 2 ? "lg:mt-6" : ""
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50 rounded-2xl" />
        <div className="relative z-10 text-center max-w-xs">
          <p className="font-serif text-2xl sm:text-3xl lg:text-4xl text-white/90 leading-tight mb-6 italic">
            Moldando o Etéreo
          </p>
          <p className="font-sans text-sm sm:text-base text-white/50 leading-relaxed mb-8">
            Tem ideias de como melhorar o PeerFolio? Deixe seu feedback.
          </p>
          <Button
            variant="ghost"
            size="lg"
            className="text-white/70 border border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-300 rounded-lg px-6"
          >
            Contribuir feedback
          </Button>
        </div>
      </div>
    );
  };

  const renderGridItems = () => {
    const items: React.ReactNode[] = [];
    let feedbackIndex = 0;

    displayItems.forEach((portfolio, idx) => {
      if (isFeedbackPosition(idx) && idx < displayItems.length) {
        const feedbackPos = FEEDBACK_POSITIONS[feedbackIndex];
        items.push(getFeedbackCard(feedbackPos));
        feedbackIndex++;
      }

      items.push(
        <div
          key={portfolio._id}
          className={
            (idx + feedbackIndex) % 3 === 1
              ? "sm:mt-12"
              : (idx + feedbackIndex) % 3 === 2
                ? "lg:mt-6"
                : ""
          }
        >
          <FeedCard
            portfolio={portfolio}
            onOpenModal={(p) => setPreviewPortfolio(p)}
          />
        </div>,
      );
    });

    return items;
  };

  return (
    <div className="min-h-screen">
      {/* ------------------------------------------------------------------ */}
      {/* Static Header                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative w-full py-10 md:py-16 border-b border-transparent">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Title */}
          <h1 className="relative font-serif font-light tracking-tight text-foreground mx-auto max-w-6xl leading-snug mb-4">
            <span className="flex flex-wrap items-baseline justify-center gap-x-1 sm:gap-x-2 gap-y-1">
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tighter">
                Explorando obras
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="inline-flex items-baseline justify-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic hover:opacity-80 transition-opacity decoration-primary/30 underline-offset-[6px] outline-none group focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm ml-1 sm:ml-2 mr-2 sm:mr-3" />
                  }
                >
                  <span className="border-b-2 border-primary/30 group-hover:border-primary/60 transition-colors cursor-pointer pb-0.5 sm:pb-1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                    {FILTERS.find((f) => f.value === currentFilter)?.label}
                  </span>
                  <ChevronDown className="ml-1 text-primary w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className="w-56 bg-[#131313]/95 backdrop-blur-xl border-white/10 text-white rounded-xl p-2"
                >
                  {FILTERS.map((f) => (
                    <DropdownMenuItem
                      key={f.value}
                      onClick={() => setCurrentFilter(f.value)}
                      className={cn(
                        "rounded-lg cursor-pointer transition-colors px-3 py-2 text-sm font-sans",
                        currentFilter === f.value
                          ? "bg-primary/20 text-primary focus:bg-primary/30 focus:text-primary font-medium"
                          : "hover:bg-white/5 focus:bg-white/5 text-white/80",
                      )}
                    >
                      {f.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="opacity-80 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mr-1 sm:mr-2">
                em
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="inline-flex items-baseline justify-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic hover:opacity-80 transition-opacity decoration-primary/30 underline-offset-[6px] outline-none group focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm" />
                  }
                >
                  <span className="border-b-2 border-primary/30 group-hover:border-primary/60 transition-colors cursor-pointer pb-0.5 sm:pb-1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                    {CATEGORIES.find((c) => c.value === selectedArea)?.label}
                  </span>
                  <ChevronDown className="ml-1 text-primary w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className="w-56 bg-[#131313]/95 backdrop-blur-xl border-white/10 text-white rounded-xl p-2 max-h-[60vh] overflow-y-auto"
                >
                  {CATEGORIES.map((cat) => (
                    <DropdownMenuItem
                      key={cat.label}
                      onClick={() => setSelectedArea(cat.value)}
                      className={cn(
                        "rounded-lg cursor-pointer transition-colors px-3 py-2 text-sm font-sans",
                        selectedArea === cat.value
                          ? "bg-primary/20 text-primary focus:bg-primary/30 focus:text-primary font-medium"
                          : "hover:bg-white/5 focus:bg-white/5 text-white/80",
                      )}
                    >
                      {cat.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </h1>

          {/* Description */}
          <div className="mt-4 sm:mt-6">
            <p className="font-sans text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg lg:text-xl leading-relaxed">
              Uma curadoria de craftsmanship digital, portfólios de excelência e
              trabalhos que inspiram. Explore, critique e evolua.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Content Grid                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="container mx-auto max-w-7xl px-4 py-4">
        {/* Grid */}
        {(displayItems.length > 0 || isFirstLoad) && (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {displayItems.length > 0 ? (
              renderGridItems()
            ) : (
              <>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className={i % 3 === 1 ? "sm:mt-12" : ""}
                  >
                    <FeedCardSkeleton />
                  </div>
                ))}
              </>
            )}

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
