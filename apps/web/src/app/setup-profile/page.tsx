"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@PeerFolio/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AREA_VALUES, type Area } from "@PeerFolio/backend/convex/lib/constants";

// ---------------------------------------------------------------------------
// Inner form (inside Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

function SetupProfileForm() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const upsertProfile = useMutation(api.users.mutations.upsertProfile);

  const [nickname, setNickname] = useState("");
  const [primaryArea, setPrimaryArea] = useState<Area | "">("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    nickname?: string;
    primaryArea?: string;
    bio?: string;
    general?: string;
  }>({});

  const NICKNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    if (!NICKNAME_REGEX.test(nickname)) {
      newErrors.nickname =
        "Nickname deve ter entre 3 e 30 caracteres e conter apenas letras, números e underscore (_).";
    }
    if (!primaryArea) {
      newErrors.primaryArea = "Área primária é obrigatória.";
    }
    if (bio.length > 160) {
      newErrors.bio = "Bio pode ter no máximo 160 caracteres.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await upsertProfile({
        nickname: nickname.trim(),
        primaryArea: primaryArea as Area,
        bio: bio.trim() || undefined,
      });

      router.push(redirectTo as Parameters<typeof router.push>[0]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NICKNAME_TAKEN")) {
        setErrors({ nickname: "Este nickname já está em uso. Tente outro." });
      } else {
        setErrors({ general: "Erro ao salvar perfil. Tente novamente." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return <div className="h-12 animate-pulse rounded-md bg-muted" />;
  }

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

      {/* Nickname */}
      <div className="space-y-1.5">
        <label htmlFor="nickname" className="block text-sm font-medium">
          Nickname <span aria-hidden="true" className="text-destructive">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
            @
          </span>
          <input
            id="nickname"
            type="text"
            name="nickname"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setErrors((prev) => ({ ...prev, nickname: undefined }));
            }}
            placeholder="seu_nickname"
            autoComplete="username"
            minLength={3}
            maxLength={30}
            aria-describedby={errors.nickname ? "nickname-error" : "nickname-hint"}
            aria-invalid={errors.nickname ? "true" : undefined}
            className="w-full rounded-md border bg-background pl-7 pr-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2"
          />
        </div>
        {errors.nickname ? (
          <p id="nickname-error" role="alert" className="text-xs text-destructive">
            {errors.nickname}
          </p>
        ) : (
          <p id="nickname-hint" className="text-xs text-muted-foreground">
            3–30 caracteres. Apenas letras, números e underscore.
          </p>
        )}
      </div>

      {/* Primary Area */}
      <div className="space-y-1.5">
        <label htmlFor="primary-area" className="block text-sm font-medium">
          Área Primária <span aria-hidden="true" className="text-destructive">*</span>
        </label>
        <select
          id="primary-area"
          name="primaryArea"
          value={primaryArea}
          onChange={(e) => {
            setPrimaryArea(e.target.value as Area);
            setErrors((prev) => ({ ...prev, primaryArea: undefined }));
          }}
          aria-describedby={errors.primaryArea ? "area-error" : undefined}
          aria-invalid={errors.primaryArea ? "true" : undefined}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2"
        >
          <option value="">Selecione sua área…</option>
          {AREA_VALUES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        {errors.primaryArea && (
          <p id="area-error" role="alert" className="text-xs text-destructive">
            {errors.primaryArea}
          </p>
        )}
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="bio" className="block text-sm font-medium">
            Bio <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          {bio.length >= 128 && (
            <span
              className={`text-xs tabular-nums ${bio.length >= 160 ? "text-destructive font-medium" : "text-muted-foreground"}`}
            >
              {bio.length}/160
            </span>
          )}
        </div>
        <textarea
          id="bio"
          name="bio"
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            setErrors((prev) => ({ ...prev, bio: undefined }));
          }}
          placeholder="Fale um pouco sobre você…"
          maxLength={160}
          rows={3}
          aria-describedby={errors.bio ? "bio-error" : undefined}
          aria-invalid={errors.bio ? "true" : undefined}
          className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2"
        />
        {errors.bio && (
          <p id="bio-error" role="alert" className="text-xs text-destructive">
            {errors.bio}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Salvando…" : "Salvar Perfil"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page export — must wrap useSearchParams in Suspense
// ---------------------------------------------------------------------------

export default function SetupProfilePage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 md:px-6">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold md:text-3xl">Configure seu Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Complete seu perfil antes de continuar. Você pode atualizar essas informações depois.
        </p>
      </header>

      <Suspense fallback={<div className="h-48 animate-pulse rounded-lg border bg-muted/30" />}>
        <SetupProfileForm />
      </Suspense>
    </main>
  );
}
