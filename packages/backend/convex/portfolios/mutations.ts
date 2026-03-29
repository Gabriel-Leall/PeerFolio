import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { AREA_VALUES } from "../lib/constants";
import { getInternalUser } from "../lib/auth";
import { normalizeUrl, isSafeUrl } from "../lib/urlUtils";

const areaValidator = v.union(
  v.literal(AREA_VALUES[0]),
  v.literal(AREA_VALUES[1]),
  v.literal(AREA_VALUES[2]),
  v.literal(AREA_VALUES[3]),
  v.literal(AREA_VALUES[4]),
  v.literal(AREA_VALUES[5]),
);

const PREVIEW_REFRESH_COOLDOWN_MS = 24 * 60 * 60 * 1000;

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

    // Field limit validation
    if (args.title.length > 80) {
      throw new ConvexError("TITLE_TOO_LONG");
    }
    if ((args.goalsContext ?? "").length > 300) {
      throw new ConvexError("GOALS_CONTEXT_TOO_LONG");
    }
    if (args.stack.length > 8) {
      throw new ConvexError("STACK_TOO_MANY_TAGS");
    }

    // Normalize URL
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(args.url);
    } catch {
      throw new ConvexError("INVALID_URL");
    }

    if (!isSafeUrl(normalizedUrl)) {
      throw new ConvexError("UNSAFE_URL");
    }

    // Check for duplicate normalizedUrl
    const existing = await ctx.db
      .query("portfolios")
      .withIndex("by_normalizedUrl", (q) =>
        q.eq("normalizedUrl", normalizedUrl),
      )
      .first();

    if (existing !== null && !existing.isDeleted) {
      throw new ConvexError({
        code: "DUPLICATE_URL",
        existingPortfolioId: existing._id,
      });
    }

    // Check if exists as seed
    const seededPortfolio = await ctx.db
      .query("portfolios")
      .withIndex("by_isSeeded_and_normalizedUrl", (q) =>
        q.eq("isSeeded", true).eq("normalizedUrl", normalizedUrl),
      )
      .first();

    if (seededPortfolio) {
      await ctx.db.patch(seededPortfolio._id, {
        authorId: user._id,
        isSeeded: false,
        title: args.title,
        stack: args.stack,
        goalsContext: args.goalsContext,
      });

      await ctx.db.patch(user._id, {
        portfoliosCount: user.portfoliosCount + 1,
      });

      return { portfolioId: seededPortfolio._id, claimed: true };
    }

    const now = Date.now();

    const portfolioId = await ctx.db.insert("portfolios", {
      authorId: user._id,
      url: args.url,
      normalizedUrl,
      title: args.title,
      area: args.area,
      stack: args.stack,
      goalsContext: args.goalsContext,
      averageRating: 0,
      critiqueCount: 0,
      likeCount: 0,
      topRatedScore: 0,
      lastCritiqueAt: undefined,
      isDeleted: false,
      isArchived: false,
      isSeeded: false,
      previewStatus: "pending",
      previewAttemptCount: 0,
      previewRefreshRequestedAt: now,
      urlStatus: "unchecked",
      consecutiveOfflineCount: 0,
      createdAt: now,
    });

    // Increment user's portfoliosCount
    await ctx.db.patch(user._id, {
      portfoliosCount: user.portfoliosCount + 1,
    });

    // T036: Kick off preview generation.
    await ctx.scheduler.runAfter(
      0,
      internal.portfolios.scheduled.generatePreview,
      { portfolioId, normalizedUrl, attemptCount: 0 },
    );

    return { portfolioId, claimed: false };
  },
});

// ---------------------------------------------------------------------------
// portfolios.delete — T041
// Authenticated soft-delete
// ---------------------------------------------------------------------------

export const deletePortfolio = mutation({
  args: {
    portfolioId: v.id("portfolios"),
  },
  handler: async (ctx, args) => {
    const user = await getInternalUser(ctx);

    const portfolio = await ctx.db.get(args.portfolioId);
    if (!portfolio || portfolio.isDeleted) {
      throw new ConvexError("NOT_FOUND");
    }

    if (portfolio.authorId !== user._id) {
      throw new ConvexError("UNAUTHORIZED");
    }

    await ctx.db.patch(args.portfolioId, {
      isDeleted: true,
      deletedAt: Date.now(),
    });

    // Decrement user's portfoliosCount
    await ctx.db.patch(user._id, {
      portfoliosCount: Math.max(0, user.portfoliosCount - 1),
    });
  },
});

export const refreshPreview = mutation({
  args: {
    portfolioId: v.id("portfolios"),
  },
  returns: v.object({
    status: v.union(v.literal("scheduled"), v.literal("cooldown")),
    retryAfterMs: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const user = await getInternalUser(ctx);
    const portfolio = await ctx.db.get(args.portfolioId);

    if (!portfolio || portfolio.isDeleted) {
      throw new ConvexError("NOT_FOUND");
    }

    if (portfolio.authorId !== user._id) {
      throw new ConvexError("UNAUTHORIZED");
    }

    const now = Date.now();
    const lastRefreshAt = portfolio.previewRefreshRequestedAt;
    const elapsed = lastRefreshAt === undefined ? PREVIEW_REFRESH_COOLDOWN_MS : now - lastRefreshAt;

    if (lastRefreshAt !== undefined && elapsed < PREVIEW_REFRESH_COOLDOWN_MS) {
      return {
        status: "cooldown" as const,
        retryAfterMs: PREVIEW_REFRESH_COOLDOWN_MS - elapsed,
      };
    }

    await ctx.db.patch(args.portfolioId, {
      previewStatus: "pending",
      previewAttemptCount: 0,
      previewRefreshRequestedAt: now,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.portfolios.scheduled.generatePreview,
      {
        portfolioId: portfolio._id,
        normalizedUrl: portfolio.normalizedUrl,
        attemptCount: 0,
      },
    );

    return { status: "scheduled" as const };
  },
});
