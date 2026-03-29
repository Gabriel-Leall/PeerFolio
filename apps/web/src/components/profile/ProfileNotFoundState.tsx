"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@PeerFolio/ui/components/button";

import { FlowButton } from "@/components/flow-button";

export function ProfileNotFoundState() {
  const router = useRouter();

  return (
    <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-surface-container-lowest px-6 py-16 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(132,94,247,0.14),transparent_62%)]" />
      <div className="pointer-events-none absolute -left-24 bottom-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      <div
        className="pointer-events-none absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 h-125 w-175 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse, rgba(132,94,247,0.2), rgba(121,80,242,0.12), transparent 72%)",
        }}
      />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-14 text-center sm:px-10">
        <h1 className="relative mb-4 text-[6rem] font-serif italic leading-none tracking-tight text-white/10 sm:text-[9rem]">
          404
          <span className="absolute inset-0 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            404
          </span>
        </h1>

        <h2 className="max-w-3xl font-serif text-4xl italic leading-tight text-on-surface sm:text-6xl">
          ops... Acho que encontrou um dos nossos exemplos
        </h2>

        <p className="mt-6 max-w-2xl text-lg text-on-surface-variant">
          o usuário nao existe, mas caso conheça avise ele para participar do peerfolio.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
                return;
              }
              router.push("/feed" as any);
            }}
            className="h-12 rounded-full border border-white/10 bg-[#131313]/85 px-7 text-sm font-medium text-white transition-all duration-300 hover:border-primary/60 hover:bg-[#1b1b1f] hover:text-[#e9dcff]"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>

          <Link href={"/sign-up" as any}>
            <FlowButton text="Join Peerfolio" />
          </Link>
        </div>

        <p className="mt-8 text-[11px] uppercase tracking-[0.35em] text-on-surface-variant/70">
          Curated in the Void
        </p>
      </div>
    </section>
  );
}
