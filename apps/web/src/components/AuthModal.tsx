"use client";

import { X } from "lucide-react";
import { useEffect, useMemo } from "react";

type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  redirectTo?: string;
};

const DEFAULT_TITLE = "Entre para continuar";
const DEFAULT_DESCRIPTION = "Faça login para concluir esta ação no PeerFolio.";

export default function AuthModal({
  open,
  onOpenChange,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  redirectTo,
}: AuthModalProps) {
  const redirectParam = useMemo(() => {
    if (!redirectTo || redirectTo.trim().length === 0) {
      return "";
    }

    return `redirect=${encodeURIComponent(redirectTo)}`;
  }, [redirectTo]);

  const githubHref = useMemo(() => {
    const params = [redirectParam, "provider=github"].filter(Boolean).join("&");
    return params.length > 0 ? `/sign-in?${params}` : "/sign-in";
  }, [redirectParam]);

  const googleHref = useMemo(() => {
    const params = [redirectParam, "provider=google"].filter(Boolean).join("&");
    return params.length > 0 ? `/sign-in?${params}` : "/sign-in";
  }, [redirectParam]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-label="Auth modal overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        aria-describedby="auth-modal-description"
        aria-labelledby="auth-modal-title"
        aria-modal="true"
        className="w-full max-w-md rounded-lg border bg-background p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold" id="auth-modal-title">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground" id="auth-modal-description">
              {description}
            </p>
          </div>
          <button
            aria-label="Fechar modal de autenticação"
            className="rounded-md border p-2 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-3">
          {/* TODO(T016): trocar para fluxo oficial do Clerk (SignInButton/modal) quando configurado. */}
          <a
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-muted"
            href={githubHref}
          >
            Continuar com GitHub
          </a>
          <a
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-muted"
            href={googleHref}
          >
            Continuar com Google
          </a>
        </div>
      </div>
    </div>
  );
}
