import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
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
    const now = Date.now();

    let systemUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", "seed-system"))
      .unique();

    if (!systemUser) {
      const systemUserId = await ctx.db.insert("users", {
        clerkId: "seed-system",
        nickname: "Seed System",
        availabilityStatus: "unavailable",
        portfoliosCount: 0,
        critiquesGivenCount: 0,
        upvotesReceivedCount: 0,
        createdAt: Date.now(),
      });

      systemUser = await ctx.db.get(systemUserId);
      if (!systemUser) {
        throw new Error("FAILED_TO_CREATE_SEED_SYSTEM_USER");
      }
    }

    const portfolioId = await ctx.db.insert("portfolios", {
      createdAt: now,
      authorId: systemUser._id,
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
      previewStatus: "pending",
      previewAttemptCount: 0,
      previewRefreshRequestedAt: now,
      urlStatus: "unchecked",
      consecutiveOfflineCount: 0,
    });

    return portfolioId;
  },
});

export const replaceSeedUrl = internalMutation({
  args: {
    portfolioId: v.id("portfolios"),
    url: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const normalizedUrl = normalizeUrl(args.url);
    const now = Date.now();

    await ctx.db.patch(args.portfolioId, {
      url: args.url,
      normalizedUrl,
      previewStatus: "pending",
      previewAttemptCount: 0,
      previewRefreshRequestedAt: now,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.portfolios.scheduled.generatePreview,
      {
        portfolioId: args.portfolioId,
        normalizedUrl,
        attemptCount: 0,
      },
    );

    return null;
  },
});

export const deleteSeed = internalMutation({
  args: {
    portfolioId: v.id("portfolios"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const portfolio = await ctx.db.get(args.portfolioId);

    if (!portfolio) {
      return null;
    }

    await ctx.db.patch(args.portfolioId, {
      isDeleted: true,
      deletedAt: Date.now(),
    });

    return null;
  },
});
