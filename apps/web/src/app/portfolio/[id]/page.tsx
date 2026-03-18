type PortfolioDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PortfolioDetailPage({ params }: PortfolioDetailPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      <header className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold md:text-3xl">Portfolio</h1>
        <p className="text-sm text-muted-foreground">
          Página de detalhes do portfolioId: <span className="font-mono">{id}</span>
        </p>
      </header>

      <section
        aria-live="polite"
        className="mb-6 rounded-lg border border-dashed border-amber-500/60 bg-amber-500/10 p-4 text-sm"
      >
        <p className="font-medium text-amber-200">Integração pendente</p>
        <p className="mt-1 text-amber-100/90">
          TODO(T017): conectar com query canônica api.portfolios.getById quando estiver disponível.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="space-y-6">
          <article className="rounded-lg border p-4 md:p-5">
            <h2 className="mb-3 text-lg font-semibold">Portfolio Preview</h2>
            <div className="flex min-h-70 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground md:min-h-90">
              Placeholder de preview (previewUrl / url)
            </div>
          </article>

          <article className="rounded-lg border p-4 md:p-5">
            <h2 className="mb-3 text-lg font-semibold">Metadata</h2>
            <div className="grid gap-3 text-sm">
              <p className="text-muted-foreground">Título, area, stack, authorId e createdAt serão exibidos aqui.</p>
              <ul className="grid gap-2 text-muted-foreground">
                <li>Título: ...</li>
                <li>Area: ...</li>
                <li>Stack: ...</li>
                <li>authorId: ...</li>
                <li>createdAt: ...</li>
              </ul>
            </div>
          </article>
        </section>

        <aside className="space-y-6">
          <article className="rounded-lg border p-4 md:p-5">
            <h2 className="mb-3 text-lg font-semibold">⚙ FEEDBACK REQUEST</h2>
            <p className="text-sm text-muted-foreground">
              goalsContext será renderizado aqui quando presente no Portfolio.
            </p>
          </article>

          <article className="rounded-lg border p-4 md:p-5">
            <h2 className="mb-3 text-lg font-semibold">Community Critiques</h2>
            <div className="grid gap-3">
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Placeholder de CritiqueCard 1
              </div>
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Placeholder de CritiqueCard 2
              </div>
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Loading/empty state até integração com dados reais
              </div>
            </div>
          </article>
        </aside>
      </div>
    </main>
  );
}
