import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { query } from "../_generated/server";
import { AREA_VALUES } from "../lib/constants";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1_000;

export const getById = query({
  args: {
    portfolioId: v.id("portfolios"),
  },
  returns: v.union(
    v.object({
      _id: v.id("portfolios"),
      title: v.string(),
      url: v.string(),
      normalizedUrl: v.string(),
      area: v.string(),
      stack: v.array(v.string()),
      goalsContext: v.optional(v.string()),
      previewImageUrl: v.optional(v.string()),
      previewStatus: v.optional(
        v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
      ),
      previewAttemptCount: v.optional(v.number()),
      previewRefreshRequestedAt: v.optional(v.number()),
      averageRating: v.number(),
      critiqueCount: v.number(),
      likeCount: v.number(),
      topRatedScore: v.number(),
      lastCritiqueAt: v.optional(v.number()),
      isDeleted: v.boolean(),
      createdAt: v.number(),
      urlStatus: v.optional(
        v.union(
          v.literal("online"),
          v.literal("offline"),
          v.literal("unchecked"),
        ),
      ),
      consecutiveOfflineCount: v.optional(v.number()),
      author: v.object({
        _id: v.id("users"),
        nickname: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        primaryArea: v.optional(v.string()),
      }),
      hasLiked: v.optional(v.boolean()),
    }),
    v.null(),
  ),
  handler: async (ctx, { portfolioId }) => {
    const portfolio = await ctx.db.get(portfolioId);

    if (portfolio === null || portfolio.isDeleted) {
      return null;
    }

    const author = await ctx.db.get(portfolio.authorId);

    let hasLiked = false;
    const identity = await ctx.auth.getUserIdentity();
    if (identity !== null) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (user) {
        const existingLike = await ctx.db
          .query("portfolioLikes")
          .withIndex("by_portfolioId_userId", (q) =>
            q.eq("portfolioId", portfolioId).eq("userId", user._id),
          )
          .unique();
        hasLiked = existingLike !== null;
      }
    }

    return {
      ...portfolio,
      area: portfolio.area as string,
      hasLiked,
      author: {
        _id: portfolio.authorId,
        nickname: author?.nickname,
        avatarUrl: author?.avatarUrl,
        primaryArea: author?.primaryArea as string | undefined,
      },
    };
  },
});

export const getCritiques = query({
  args: {
    portfolioId: v.id("portfolios"),
  },
  returns: v.array(
    v.object({
      _id: v.id("critiques"),
      portfolioId: v.id("portfolios"),
      rating: v.number(),
      feedback: v.string(),
      upvotes: v.number(),
      createdAt: v.number(),
      author: v.object({
        _id: v.id("users"),
        nickname: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        primaryArea: v.optional(v.string()),
      }),
    }),
  ),
  handler: async (ctx, { portfolioId }) => {
    const critiques = await ctx.db
      .query("critiques")
      .withIndex("by_portfolioId", (q) => q.eq("portfolioId", portfolioId))
      .order("desc")
      .collect();

    return Promise.all(
      critiques.map(async (critique) => {
        const author = await ctx.db.get(critique.authorId);
        return {
          ...critique,
          author: {
            _id: critique.authorId,
            nickname: author?.nickname,
            avatarUrl: author?.avatarUrl,
            primaryArea: author?.primaryArea as string | undefined,
          },
        };
      }),
    );
  },
});

const areaValidator = v.union(
  v.literal(AREA_VALUES[0]),
  v.literal(AREA_VALUES[1]),
  v.literal(AREA_VALUES[2]),
  v.literal(AREA_VALUES[3]),
  v.literal(AREA_VALUES[4]),
  v.literal(AREA_VALUES[5]),
);

export const list = query({
  args: {
    filter: v.union(v.literal("latest"), v.literal("topRated")),
    area: v.optional(areaValidator),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { filter, area, paginationOpts } = args;
    const now = Date.now();
    const recentWindowStart = now - THIRTY_DAYS_MS;

    let filteredQuery;

    if (filter === "latest") {
      filteredQuery = ctx.db
        .query("portfolios")
        .withIndex("by_createdAt")
        .order("desc")
        .filter((q) =>
          q.and(
            q.eq(q.field("isDeleted"), false),
            q.neq(q.field("isArchived"), true),
          ),
        );
    } else if (filter === "topRated") {
      filteredQuery = ctx.db
        .query("portfolios")
        .withIndex("by_topRatedScore")
        .order("desc")
        .filter((q) =>
          q.and(
            q.eq(q.field("isDeleted"), false),
            q.neq(q.field("isArchived"), true),
          ),
        );
    } else {
      filteredQuery = ctx.db
        .query("portfolios")
        .filter((q) =>
          q.and(
            q.eq(q.field("isDeleted"), false),
            q.neq(q.field("isArchived"), true),
          ),
        );
    }

    if (area) {
      filteredQuery = filteredQuery.filter((q) => q.eq(q.field("area"), area));
    }

    if (filter === "topRated") {
      filteredQuery = filteredQuery.filter((q) =>
        q.and(
          q.gt(q.field("critiqueCount"), 0),
          q.gte(q.field("lastCritiqueAt"), recentWindowStart),
        ),
      );
    }

    const paginatedResult = await filteredQuery.paginate(paginationOpts);

    let loggedInUser = null;
    const identity = await ctx.auth.getUserIdentity();
    if (identity !== null) {
      loggedInUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
    }

    const pageWithAuthorsAndLikes = await Promise.all(
      paginatedResult.page.map(async (portfolio) => {
        const author = await ctx.db.get(portfolio.authorId);
        let hasLiked = false;

        if (loggedInUser) {
          const existingLike = await ctx.db
            .query("portfolioLikes")
            .withIndex("by_portfolioId_userId", (q) =>
              q.eq("portfolioId", portfolio._id).eq("userId", loggedInUser._id),
            )
            .unique();
          hasLiked = !!existingLike;
        }

        return {
          ...portfolio,
          area: portfolio.area as string,
          hasLiked,
          author: {
            _id: portfolio.authorId,
            nickname: author?.nickname,
            avatarUrl: author?.avatarUrl,
            primaryArea: author?.primaryArea as string | undefined,
          },
        };
      }),
    );

    return {
      ...paginatedResult,
      page: pageWithAuthorsAndLikes,
    };
  },
});
