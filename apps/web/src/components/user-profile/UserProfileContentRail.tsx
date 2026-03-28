import { BookOpen, MessageSquare, Plus, Sparkles } from "lucide-react";
import Link from "next/link";

import type { UserProfileTab, UserProfilePortfolio, UserProfileCritique } from "./types";
import { UserProfilePortfolioCardXL } from "./UserProfilePortfolioCardXL";
import { UserProfileCritiqueCardXL } from "./UserProfileCritiqueCardXL";

type UserProfileContentRailProps = {
  activeTab: UserProfileTab;
  portfolios: UserProfilePortfolio[];
  critiques: UserProfileCritique[];
  isOwner?: boolean;
};

function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-low py-16 text-center">
      <div className="rounded-full bg-surface-container p-4 text-on-surface-variant/40">{icon}</div>
      <h3 className="mt-4 font-serif text-xl italic text-on-surface">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-on-surface-variant">{message}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function UserProfileContentRail({
  activeTab,
  portfolios,
  critiques,
  isOwner,
}: UserProfileContentRailProps) {
  if (activeTab === "portfolios") {
    if (portfolios.length === 0) {
      return (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title={isOwner ? "Nenhum portfólio ainda" : "Sem portfólios"}
          message={
            isOwner
              ? "Você ainda não submeteu nenhum portfólio. Comece a mostrar seu trabalho."
              : "Este usuário ainda não possui portfólios publicados."
          }
          action={
            isOwner ? (
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Submeter portfólio
              </Link>
            ) : undefined
          }
        />
      );
    }

    return (
      <div className="grid gap-6">
        {portfolios.map((p) => (
          <UserProfilePortfolioCardXL key={p._id} portfolio={p} />
        ))}
      </div>
    );
  }

  if (critiques.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-8 w-8" />}
        title={isOwner ? "Nenhuma crítica ainda" : "Sem críticas"}
        message={
          isOwner
            ? "Você ainda não deixou nenhuma crítica. Explore o feed e ajude outros."
            : "Este usuário ainda não deixou críticas em portfólios."
        }
        action={
          isOwner ? (
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              Explorar feed
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid gap-4">
      {critiques.map((c) => (
        <UserProfileCritiqueCardXL key={c._id} critique={c} />
      ))}
    </div>
  );
}
