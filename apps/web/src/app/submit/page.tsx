import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Submeter Portfólio | PeerFolio",
  description: "Submeta seu portfólio para receber críticas da comunidade.",
};

export default async function SubmitPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect=/submit");
  }

  // SubmitPortfolioForm is a client component that handles the form logic
  // including nickname check redirect to /setup-profile
  const { default: SubmitPortfolioForm } = await import("./SubmitPortfolioForm");

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 md:px-6">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold md:text-3xl">Submeter Portfólio</h1>
        <p className="text-sm text-muted-foreground">
          Compartilhe seu trabalho e receba feedback honesto da comunidade de devs.
        </p>
      </header>

      <SubmitPortfolioForm />
    </main>
  );
}
