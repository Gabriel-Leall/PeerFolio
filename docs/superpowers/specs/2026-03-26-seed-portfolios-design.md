# Seed Portfolios - Design

## Problema

O projeto PeerFolio ainda não tem portfólios presentes. Para despertar interesse dos usuários, é necessário popular a plataforma com portfólios de exemplo (seeds).

## Solução

Sistema de seed portfolios que permite:
1. Criar portfólios de exemplo sem dono (isSeeded: true)
2. Quando um usuário submete uma URL que já existe como seed, ele "reivindica" o registro existente
3. Críticas e likes do seed são preservados após a reivindicação

---

## Implementação

### 1. Schema

Adicionar campo `isSeeded` na tabela portfolios:

```typescript
// packages/backend/convex/schema.ts
portfolios: defineTable({
  // ... campos existentes
  isSeeded: v.optional(v.boolean()),  // NOVO CAMPO
})
  .index("by_isSeeded_and_normalizedUrl", ["isSeeded", "normalizedUrl"])  // NOVO ÍNDICE
```

### 2. Mutation `submit`

Modificar para verificar seed antes de criar novo registro:

```typescript
// packages/backend/convex/portfolios/mutactions.ts
export const submit = mutation({
  args: {
    url: v.string(),
    title: v.string(),
    area: areaValidator,
    stack: v.array(v.string()),
    goalsContext: v.optional(v.string()),
  },
  returns: v.object({
    portfolioId: v.id("portfolios"),
    claimed: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getInternalUser(ctx);
    
    // ... validações existentes (title length, goalsContext, stack, URL) ...

    const normalizedUrl = normalizeUrl(args.url);

    // CHECAR SE EXISTE SEED
    const seededPortfolio = await ctx.db
      .query("portfolios")
      .withIndex("by_isSeeded_and_normalizedUrl", (q) =>
        q.eq("isSeeded", true).eq("normalizedUrl", normalizedUrl)
      )
      .first();

    if (seededPortfolio) {
      // REIVINDICAR SEED
      await ctx.db.patch(seededPortfolio._id, {
        authorId: user._id,
        isSeeded: false,
        title: args.title,
        stack: args.stack,
        goalsContext: args.goalsContext,
      });

      // Incrementa contagem do usuário
      await ctx.db.patch(user._id, {
        portfoliosCount: user.portfoliosCount + 1,
      });

      return { portfolioId: seededPortfolio._id, claimed: true };
    }

    // FLUXO NORMAL - URL nova
    const portfolioId = await ctx.db.insert("portfolios", {
      authorId: user._id,
      url: args.url,
      normalizedUrl,
      title: args.title,
      area: args.area,
      stack: args.stack,
      goalsContext: args.goalsContext,
      isSeeded: false,
      // ... outros campos com valores default
    });

    return { portfolioId, claimed: false };
  },
});
```

### 3. Mutation interna para criar seeds

```typescript
// packages/backend/convex/portfolios/seeds.ts
export const createSeed = internalMutation({
  args: {
    url: v.string(),
    title: v.string(),
    area: areaValidator,
    stack: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedUrl = normalizeUrl(args.url);
    const hasScreenshotProvider = Boolean(process.env.SCREENSHOT_ONE_KEY);

    await ctx.db.insert("portfolios", {
      authorId: "system", // placeholder - não pertence a ninguém
      url: args.url,
      normalizedUrl,
      title: args.title,
      area: args.area,
      stack: args.stack,
      isSeeded: true,
      averageRating: 0,
      critiqueCount: 0,
      likeCount: 0,
      topRatedScore: 0,
      lastCritiqueAt: undefined,
      isDeleted: false,
      isArchived: false,
      previewStatus: hasScreenshotProvider ? "pending" : "failed",
      previewAttemptCount: 0,
      urlStatus: "unchecked",
      consecutiveOfflineCount: 0,
      createdAt: Date.now(),
    });
  },
});
```

### 4. Frontend - Tratar retorno

```typescript
// apps/web/src/components/portfolio-form.tsx (exemplo)
const result = await submitPortfolio(args);

if (result.claimed) {
  toast("Parabens por reivindiciar seu portfolio, se ele foi seedado é porque o autor do projeto achou seu projeto incrivel, me siga nas rede sociais");
} else {
  toast("Portfólio submetido com sucesso!");
}

router.push(`/portfolio/${result.portfolioId}`);
```

---

## Comportamento Preservado

- Críticas e likes do seed permanecem intactos após reivindicação
- O novo dono pode editar título, stack e goalsContext
- Contagem de portfólios do usuário é incrementada

---

## Tarefas de Implementação

1. Adicionar campo `isSeeded` no schema
2. Adicionar índice `by_isSeeded_and_normalizedUrl`
3. Modificar mutation `submit` para detectar e reivindicar seeds
4. Criar mutation interna `createSeed` para popular seeds
5. Atualizar frontend para tratar retorno `claimed`
6. Executar seeds iniciais via mutation
