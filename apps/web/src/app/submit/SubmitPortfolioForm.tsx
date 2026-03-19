"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@PeerFolio/backend/convex/_generated/api";
import { useMutation, useAction, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AREA_VALUES, type Area } from "@PeerFolio/backend/convex/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FieldError = {
  url?: string;
  title?: string;
  area?: string;
  stack?: string;
  goalsContext?: string;
  general?: string;
};

type ValidationState = "idle" | "validating" | "valid" | "invalid";

// ---------------------------------------------------------------------------
// Predefined stack tags
// ---------------------------------------------------------------------------

const PREDEFINED_TAGS = [
  "React", "Next.js", "Vue", "Angular", "Svelte",
  "TypeScript", "JavaScript", "Python", "Rust", "Go",
  "Node.js", "FastAPI", "Django", "Rails", "Laravel",
  "Tailwind CSS", "PostgreSQL", "MySQL", "MongoDB", "Redis",
  "Docker", "AWS", "GCP", "Figma", "Three.js",
] as const;

// ---------------------------------------------------------------------------
// Character Counter sub-component
// ---------------------------------------------------------------------------

function CharCounter({ current, max }: { current: number; max: number }) {
  const pct = current / max;
  const show = pct >= 0.8;
  if (!show) return null;
  return (
    <span
      className={`text-xs tabular-nums ${current >= max ? "text-destructive font-medium" : "text-muted-foreground"}`}
    >
      {current}/{max}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SubmitPortfolioForm() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const profile = useQuery(api.users.queries.getProfile);
  useEffect(() => {
    if (profile === null) {
      router.push("/setup-profile?redirect=/submit" as any);
    }
  }, [profile, router]);

  const submitMutation = useMutation(api.portfolios.mutations.submit);
  const validateUrlAction = useAction(api.portfolios.actions.validateUrl);

  // Form fields
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<Area | "">("");
  const [stackTags, setStackTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [goalsContext, setGoalsContext] = useState("");

  // Validation state
  const [urlValidation, setUrlValidation] = useState<ValidationState>("idle");
  const [normalizedUrl, setNormalizedUrl] = useState("");
  const [errors, setErrors] = useState<FieldError>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validate URL with 800ms debounce
  const handleUrlChange = useCallback(
    (value: string) => {
      setUrl(value);
      setUrlValidation("idle");
      setNormalizedUrl("");
      setErrors((prev) => ({ ...prev, url: undefined }));

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.trim().length === 0) return;

      setUrlValidation("validating");
      debounceRef.current = setTimeout(async () => {
        try {
          const result = await validateUrlAction({ url: value.trim() });
          if (result.reachable) {
            setUrlValidation("valid");
            setNormalizedUrl(result.normalizedUrl);
            setErrors((prev) => ({ ...prev, url: undefined }));
          } else {
            setUrlValidation("invalid");
            setErrors((prev) => ({
              ...prev,
              url: "URL não alcançável. Verifique se o endereço está correto e acessível.",
            }));
          }
        } catch (err: unknown) {
          setUrlValidation("invalid");
          const msg =
            err instanceof Error && err.message.includes("INVALID_URL")
              ? "URL inválida."
              : err instanceof Error && err.message.includes("UNSAFE_URL")
                ? "URL não permitida por segurança."
                : "Erro ao validar a URL. Tente novamente.";
          setErrors((prev) => ({ ...prev, url: msg }));
        }
      }, 800);
    },
    [validateUrlAction],
  );

  // Stack tag management
  const toggleTag = (tag: string) => {
    setStackTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= 8) {
        setErrors((e) => ({ ...e, stack: "Máximo de 8 tags." }));
        return prev;
      }
      return [...prev, tag];
    });
    setErrors((prev) => ({ ...prev, stack: undefined }));
  };

  const addCustomTag = () => {
    const tag = customTagInput.trim();
    if (!tag) return;
    if (stackTags.length >= 8) {
      setErrors((e) => ({ ...e, stack: "Máximo de 8 tags." }));
      return;
    }
    if (!stackTags.includes(tag)) {
      setStackTags((prev) => [...prev, tag]);
    }
    setCustomTagInput("");
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FieldError = {};

    if (urlValidation !== "valid") {
      newErrors.url = "Por favor, insira uma URL válida e alcançável.";
    }
    if (title.trim().length === 0) {
      newErrors.title = "Título é obrigatório.";
    } else if (title.length > 80) {
      newErrors.title = "Título pode ter no máximo 80 caracteres.";
    }
    if (!area) {
      newErrors.area = "Área é obrigatória.";
    }
    if (goalsContext.length > 300) {
      newErrors.goalsContext = "Pedido de feedback pode ter no máximo 300 caracteres.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await submitMutation({
        url: normalizedUrl || url.trim(),
        title: title.trim(),
        area: area as Area,
        stack: stackTags,
        goalsContext: goalsContext.trim() || undefined,
      });

      router.push(`/portfolio/${result.portfolioId}`);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : String(err);

      if (errMsg.includes("DUPLICATE_URL")) {
        setErrors({ url: "Esse portfólio já foi submetido. Confira o feed." });
      } else if (errMsg.includes("UNAUTHENTICATED")) {
        setErrors({ general: "Você precisa estar logado para submeter um portfólio." });
      } else {
        setErrors({ general: "Erro ao submeter portfólio. Tente novamente." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = urlValidation === "valid" && !isSubmitting;

  const urlBorderClass =
    urlValidation === "valid"
      ? "border-green-500 focus:ring-green-500/30"
      : urlValidation === "invalid"
        ? "border-destructive focus:ring-destructive/30"
        : "";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {errors.general && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errors.general}
        </div>
      )}

      {/* URL */}
      <div className="space-y-1.5">
        <label htmlFor="portfolio-url" className="block text-sm font-medium">
          URL do Portfólio <span aria-hidden="true" className="text-destructive">*</span>
        </label>
        <div className="relative">
          <input
            id="portfolio-url"
            type="url"
            name="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://meuportfolio.dev"
            autoComplete="url"
            aria-describedby={errors.url ? "url-error" : undefined}
            aria-invalid={errors.url ? "true" : undefined}
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 ${urlBorderClass}`}
          />
          {urlValidation === "validating" && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              Verificando…
            </span>
          )}
          {urlValidation === "valid" && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-500">✓</span>
          )}
        </div>
        {errors.url && (
          <p id="url-error" role="alert" className="text-xs text-destructive">
            {errors.url}
          </p>
        )}
        {urlValidation === "valid" && normalizedUrl && normalizedUrl !== url && (
          <p className="text-xs text-muted-foreground">
            URL normalizada: <span className="font-mono">{normalizedUrl}</span>
          </p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="portfolio-title" className="block text-sm font-medium">
            Título <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <CharCounter current={title.length} max={80} />
        </div>
        <input
          id="portfolio-title"
          type="text"
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          placeholder="Meu portfólio de desenvolvimento web"
          maxLength={80}
          aria-describedby={errors.title ? "title-error" : undefined}
          aria-invalid={errors.title ? "true" : undefined}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2"
        />
        {errors.title && (
          <p id="title-error" role="alert" className="text-xs text-destructive">
            {errors.title}
          </p>
        )}
      </div>

      {/* Area */}
      <div className="space-y-1.5">
        <label htmlFor="portfolio-area" className="block text-sm font-medium">
          Área <span aria-hidden="true" className="text-destructive">*</span>
        </label>
        <select
          id="portfolio-area"
          name="area"
          value={area}
          onChange={(e) => {
            setArea(e.target.value as Area);
            setErrors((prev) => ({ ...prev, area: undefined }));
          }}
          aria-describedby={errors.area ? "area-error" : undefined}
          aria-invalid={errors.area ? "true" : undefined}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2"
        >
          <option value="">Selecione uma área…</option>
          {AREA_VALUES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        {errors.area && (
          <p id="area-error" role="alert" className="text-xs text-destructive">
            {errors.area}
          </p>
        )}
      </div>

      {/* Stack Tags */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="block text-sm font-medium" id="stack-label">
            Stack <span className="text-muted-foreground font-normal">(máx. 8)</span>
          </span>
          {stackTags.length > 0 && (
            <span className="text-xs text-muted-foreground">{stackTags.length}/8</span>
          )}
        </div>

        <div role="group" aria-labelledby="stack-label" className="flex flex-wrap gap-2">
          {PREDEFINED_TAGS.map((tag) => {
            const selected = stackTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={selected}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-transparent hover:bg-muted"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Custom tag input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTag();
              }
            }}
            placeholder="Tag personalizada…"
            aria-label="Adicionar tag personalizada"
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2"
          />
          <button
            type="button"
            onClick={addCustomTag}
            disabled={!customTagInput.trim() || stackTags.length >= 8}
            className="rounded-md border px-3 py-1.5 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>

        {/* Selected tags */}
        {stackTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {stackTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setStackTags((prev) => prev.filter((t) => t !== tag))}
                  aria-label={`Remover tag ${tag}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {errors.stack && (
          <p role="alert" className="text-xs text-destructive">
            {errors.stack}
          </p>
        )}
      </div>

      {/* Goals Context */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="goals-context" className="block text-sm font-medium">
            Pedido de Feedback{" "}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <CharCounter current={goalsContext.length} max={300} />
        </div>
        <textarea
          id="goals-context"
          name="goalsContext"
          value={goalsContext}
          onChange={(e) => {
            setGoalsContext(e.target.value);
            setErrors((prev) => ({ ...prev, goalsContext: undefined }));
          }}
          placeholder="Em que aspectos você quer receber feedback? Ex: UX, performance, acessibilidade…"
          maxLength={300}
          rows={3}
          aria-describedby={errors.goalsContext ? "goals-error" : undefined}
          aria-invalid={errors.goalsContext ? "true" : undefined}
          className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2"
        />
        {errors.goalsContext && (
          <p id="goals-error" role="alert" className="text-xs text-destructive">
            {errors.goalsContext}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "Submetendo…"
          : urlValidation === "validating"
            ? "Validando URL…"
            : "Submeter Portfólio"}
      </button>
    </form>
  );
}
