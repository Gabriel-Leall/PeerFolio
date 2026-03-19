import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";
import { getInternalUser } from "../lib/auth";

const ONE_HOUR_MS = 60 * 60 * 1_000;
const MAX_CRITIQUES_PER_HOUR = 5;

// ---------------------------------------------------------------------------
// critiques.submit
// ---------------------------------------------------------------------------

export const submit = mutation({
  args: {
    portfolioId: v.id("portfolios"),
    rating: v.number(),
    feedback: v.string(),
  },
  returns: v.object({ critiqueId: v.id("critiques") }),
  handler: async (ctx, args) => {
    const user = await getInternalUser(ctx);

    // Validate rating range (1–5)
    if (args.rating < 1 || args.rating > 5 || !Number.isInteger(args.rating)) {
      throw new ConvexError("INVALID_RATING");
    }

    // Validate feedback length (20–1000 chars)
    const feedbackLen = args.feedback.trim().length;
    if (feedbackLen < 20) {
      throw new ConvexError("FEEDBACK_TOO_SHORT");
    }
    if (feedbackLen > 1_000) {
      throw new ConvexError("FEEDBACK_TOO_LONG");
    }

    // Check portfolio exists
    const portfolio = await ctx.db.get(args.portfolioId);
    if (portfolio === null || portfolio.isDeleted) {
      throw new ConvexError("PORTFOLIO_NOT_FOUND");
    }

    // Prevent self-critique
    if (portfolio.authorId === user._id) {
      throw new ConvexError("SELF_CRITIQUE_NOT_ALLOWED");
    }

    // Enforce uniqueness — one critique per user per portfolio
    const existingCritique = await ctx.db
      .query("critiques")
      .withIndex("by_portfolioId", (q) => q.eq("portfolioId", args.portfolioId))
      .filter((q) => q.eq(q.field("authorId"), user._id))
      .first();

    if (existingCritique !== null) {
      throw new ConvexError("ALREADY_CRITIQUED");
    }

    // Burst rate limit: max 5 critiques per hour per user
    const oneHourAgo = Date.now() - ONE_HOUR_MS;
    const recentCritiques = await ctx.db
      .query("critiques")
      .withIndex("by_authorId", (q) => q.eq("authorId", user._id))
      .filter((q) => q.gt(q.field("createdAt"), oneHourAgo))
      .collect();

    if (recentCritiques.length >= MAX_CRITIQUES_PER_HOUR) {
      throw new ConvexError("RATE_LIMIT_EXCEEDED");
    }

    const now = Date.now();

    const critiqueId = await ctx.db.insert("critiques", {
      portfolioId: args.portfolioId,
      authorId: user._id,
      rating: args.rating,
      feedback: args.feedback.trim(),
      upvotes: 0,
      createdAt: now,
    });

    // Recalculate portfolio aggregates
    const allCritiques = await ctx.db
      .query("critiques")
      .withIndex("by_portfolioId", (q) => q.eq("portfolioId", args.portfolioId))
      .collect();

    const newCritiqueCount = allCritiques.length;
    const totalRating = allCritiques.reduce((sum, c) => sum + c.rating, 0);
    const newAverageRating = newCritiqueCount > 0 ? totalRating / newCritiqueCount : 0;

    // topRatedScore = avg_stars × log10(total_critiques + 1)
    const newTopRatedScore = newAverageRating * Math.log10(newCritiqueCount + 1);

    await ctx.db.patch(args.portfolioId, {
      critiqueCount: newCritiqueCount,
      averageRating: newAverageRating,
      topRatedScore: newTopRatedScore,
    });

    // Increment user's critiquesGivenCount
    await ctx.db.patch(user._id, {
      critiquesGivenCount: user.critiquesGivenCount + 1,
    });

    return { critiqueId };
  },
});

// ---------------------------------------------------------------------------
// critiques.upvote — T020
// ---------------------------------------------------------------------------

export const upvote = mutation({
  args: {
    critiqueId: v.id("critiques"),
  },
  returns: v.object({ upvoted: v.boolean(), upvotes: v.number() }),
  handler: async (ctx, args) => {
    const user = await getInternalUser(ctx);

    const critique = await ctx.db.get(args.critiqueId);
    if (critique === null) {
      throw new ConvexError("CRITIQUE_NOT_FOUND");
    }

    // No self-upvote
    if (critique.authorId === user._id) {
      throw new ConvexError("SELF_UPVOTE_NOT_ALLOWED");
    }

    // Idempotent toggle: check if already upvoted via a dedicated table
    // Since there's no critiqueUpvotes table in the schema, we track via a
    // naming convention in the existing tables. For MVP simplicity, we'll use
    // a separate mutation pattern — just increment (not a real toggle yet).
    // TODO: Add critiqueUpvotes table in Phase 6 for proper toggle semantics.
    // For now: upvote is a one-way increment (no double-upvote prevention at DB level).
    const newUpvotes = critique.upvotes + 1;
    await ctx.db.patch(args.critiqueId, { upvotes: newUpvotes });

    // Increment critique author's upvotesReceivedCount
    const critiqueAuthor = await ctx.db.get(critique.authorId);
    if (critiqueAuthor !== null) {
      await ctx.db.patch(critique.authorId, {
        upvotesReceivedCount: critiqueAuthor.upvotesReceivedCount + 1,
      });
    }

    return { upvoted: true, upvotes: newUpvotes };
  },
});
