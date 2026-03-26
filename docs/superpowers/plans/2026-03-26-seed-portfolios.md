# Seed Portfolios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar sistema de seed portfolios que permite criar portfólios de exemplo e quando um usuário submete uma URL existente como seed, ele reivindica o registro.

**Architecture:** Adicionar campo `isSeeded` no schema, modificar mutation `submit` para detectar e reivindicar seeds, criar mutation interna para popular seeds.

**Tech Stack:** Convex (backend), TypeScript

---

## File Structure

- `packages/backend/convex/schema.ts` - Adicionar campo isSeeded
- `packages/backend/convex/portfolios/mutations.ts` - Modificar submit para reivindicar seeds
- `packages/backend/convex/portfolios/seeds.ts` - Criar mutation interna para seeds
- `apps/web/src/` - Atualizar frontend para tratar retorno claimed

---

## Tasks

### Task 1: Adicionar campo isSeeded no Schema

**Files:**
- Modify: `packages/backend/convex/schema.ts:42-87`

- [ ] **Step 1: Ler o schema atual**

```typescript
// packages/backend/convex/schema.ts - linhas 42-87
```

- [ ] **Step 2: Adicionar campo isSeeded após o campo createdAt**

```typescript
isDeleted: v.boolean(),
isArchived: v.optional(v.boolean()),
deletedAt: v.optional(v.number()),
createdAt: v.number(),
isSeeded: v.optional(v.boolean()),  // NOVO CAMPO
```

- [ ] **Step 3: Adicionar índice composto para buscar seeds por URL**

```typescript
.index("by_isSeeded_and_normalizedUrl", ["isSeeded", "normalizedUrl"])
```

- [ ] **Step 4: Commit**

```bash
git add packages/backend/convex/schema.ts
git commit -m "feat: add isSeeded field to portfolios schema"
```

---

### Task 2: Modificar mutation submit para reivindicar seeds

**Files:**
- Modify: `packages/backend/convex/portfolios/mutations.ts:18-108`

- [ ] **Step 1: Ler a mutation submit atual**

```typescript
// packages/backend/convex/portfolios/mutations.ts - linhas 18-108
```

- [ ] **Step 2: Modificar returns para incluir claimed**

```typescript
// Linha 26
returns: v.object({
  portfolioId: v.id("portfolios"),
  claimed: v.boolean(),
}),
```

- [ ] **Step 3: Adicionar lógica de verificação de seed após validação de URL**

```typescript
// Após linha 59 (após verificar duplicate URL), adicionar:
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
```

- [ ] **Step 4: Modificar insert para incluir isSeeded: false**

```typescript
// Na seção de insert (após linha 71), adicionar:
isSeeded: false,
```

- [ ] **Step 5: Modificar return final para incluir claimed: false**

```typescript
// Linha 107
return { portfolioId, claimed: false };
```

- [ ] **Step 6: Commit**

```bash
git add packages/backend/convex/portfolios/mutations.ts
git commit -m "feat: add seed claiming logic to submit mutation"
```

---

### Task 3: Criar mutation interna para popular seeds

**Files:**
- Create: `packages/backend/convex/portfolios/seeds.ts`

- [ ] **Step 1: Verificar estrutura de mutations existentes**

```typescript
// Ver packages/backend/convex/portfolios/mutations.ts para referência
```

- [ ] **Step 2: Criar arquivo seeds.ts com mutation interna**

```typescript
"use node";

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { AREA_VALUES } from "../lib/constants";
import { normalizeUrl } from "../lib/urlUtils";

const areaValidator = v.union(
  v.literal(AREA_VALUES[0]),
  v.literal(AREA_VALUES[1]),
  v.literal(AREA_VALUES[2]),
  v.literal(AREA_VALUES[3]),
  v.literal(AREA_VALUES[4]),
  v.literal(AREA_VALUES[5]),
);

export const createSeed = internalMutation({
  args: {
    url: v.string(),
    title: v.string(),
    area: areaValidator,
    stack: v.array(v.string()),
  },
  returns: v.id("portfolios"),
  handler: async (ctx, args) => {
    const normalizedUrl = normalizeUrl(args.url);
    const hasScreenshotProvider = Boolean(process.env.SCREENSHOT_ONE_KEY);

    const portfolioId = await ctx.db.insert("portfolios", {
      authorId: "system" as any,
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

    return portfolioId;
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add packages/backend/convex/portfolios/seeds.ts
git commit -m "feat: add internal mutation to create seed portfolios"
```

---

### Task 4: Atualizar frontend para tratar retorno claimed

**Files:**
- Modify: `apps/web/src/components/portfolio-form.tsx` (ou equivalente)

- [ ] **Step 1: Encontrar onde submitPortfolio é chamado**

```bash
# Buscar no codebase
grep -r "submitPortfolio" apps/web/src/
```

- [ ] **Step 2: Modificar o tratamento do resultado**

```typescript
const result = await submitPortfolio(args);

if (result.claimed) {
  toast("Parabens por reivindiciar seu portfolio, se ele foi seedado é porque o autor do projeto achou seu projeto incrivel, me siga nas rede sociais");
} else {
  toast("Portfólio submetido com sucesso!");
}

router.push(`/portfolio/${result.portfolioId}`);
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/
git commit -m "feat: handle claimed return from portfolio submission"
```

---

### Task 5: Popular seeds iniciais

- [ ] **Step 1: Executar mutation createSeed para cada portfólio de exemplo**

```bash
# Via convex dashboard ou script
npx convex run internal.portfolios.seeds.createSeed --args '{"url": "https://exemplo1.com", "title": "Meu Portfólio 1", "area": "frontend", "stack": ["react", "typescript"]}'
```

- [ ] **Step 2: Commit**

```bash
git commit -m "seed: add initial seed portfolios"
```

---

## Execution Options

**"Plan complete and saved to `docs/superpowers/plans/2026-03-26-seed-portfolios.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?"**
