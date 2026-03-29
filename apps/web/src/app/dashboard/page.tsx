"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@PeerFolio/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getProfileRoute } from "@/lib/profile-route";

export default function DashboardRoot() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const me = useQuery(api.users.queries.getMe);

  // If the user is signed in and we have their Convex ID, redirect to their profile
  useEffect(() => {
    if (isLoaded && isSignedIn && me) {
      router.replace(getProfileRoute(me) as any);
    }
  }, [isLoaded, isSignedIn, me, router]);

  if (!isLoaded || (isSignedIn && me === undefined)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Unauthenticated visitor
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 gap-4">
      <p className="text-4xl">👤</p>
      <h1 className="text-2xl font-bold">Perfis de usuário</h1>
      <p className="text-muted-foreground max-w-sm">
        Para ver o seu próprio perfil, faça login primeiro. Para visitar o perfil
        de outro usuário, acesse o link diretamente a partir de um portfólio ou
        crítica.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
      >
        Explorar portfólios
      </Link>
    </div>
  );
}
