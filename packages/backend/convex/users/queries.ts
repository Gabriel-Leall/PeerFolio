import { ConvexError, v } from "convex/values";
import type { Doc } from "../_generated/dataModel";

import { query } from "../_generated/server";

// ---------------------------------------------------------------------------
// Reputation badge helper
// ---------------------------------------------------------------------------

function resolveReputationBadge(upvotesReceived: number): string | null {
  if (upvotesReceived >= 150) return "Top Reviewer";
  if (upvotesReceived >= 50) return "Trusted Reviewer";
  if (upvotesReceived >= 10) return "Reviewer";
  return null;
}

// ---------------------------------------------------------------------------
// users.getProfile — T030
// Public query — no auth required
// ---------------------------------------------------------------------------

export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Prefer nickname for pretty profile URLs: /profile/<nickname>
    let user: Doc<"users"> | null = await ctx.db
      .query("users")
      .withIndex("by_nickname", (q) => q.eq("nickname", args.userId))
      .first();

    // Fallback: direct _id lookup
    if (!user) {
      try {
        // ctx.db.get expects a typed Id, try it optimistically
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const maybeUser = await ctx.db.get(args.userId as any);
        // If the result is not a users doc (wrong table), fall through
        user = maybeUser && "clerkId" in maybeUser ? (maybeUser as Doc<"users">) : null;
      } catch {
        user = null;
      }
    }

    // Fallback: look up by clerkId index
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
        .unique();
    }

    if (!user) {
      return null;
    }

    // Fetch authored portfolios (not deleted)
    const portfolios = await ctx.db
      .query("portfolios")
      .withIndex("by_authorId", (q) => q.eq("authorId", user._id))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("desc")
      .collect();

    // Fetch critiques given by the user
    const critiquesRaw = await ctx.db
      .query("critiques")
      .withIndex("by_authorId", (q) => q.eq("authorId", user._id))
      .order("desc")
      .collect();

    // For each critique, resolve the portfolio (including soft-deleted)
    const critiquesGiven = await Promise.all(
      critiquesRaw.map(async (critique) => {
        const portfolio = await ctx.db.get(critique.portfolioId);
        return {
          _id: critique._id,
          portfolioId: critique.portfolioId,
          rating: critique.rating,
          feedback: critique.feedback,
          upvotes: critique.upvotes,
          createdAt: critique.createdAt,
          portfolioTitle:
            portfolio?.isDeleted || !portfolio
              ? null // T035 — deleted portfolio
              : portfolio.title,
          portfolioArea:
            portfolio?.isDeleted || !portfolio
              ? null
              : (portfolio.area as string),
        };
      }),
    );

    const reputationBadge = resolveReputationBadge(user.upvotesReceivedCount);

    return {
      _id: user._id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      primaryArea: user.primaryArea as string | undefined,
      bio: user.bio,
      stackTags: user.stackTags,
      availabilityStatus: user.availabilityStatus,
      socialLinks: user.socialLinks,
      portfoliosCount: user.portfoliosCount,
      critiquesGivenCount: user.critiquesGivenCount,
      upvotesReceivedCount: user.upvotesReceivedCount,
      reputationBadge,
      createdAt: user.createdAt,
      portfolios: portfolios.map((p) => ({
        _id: p._id,
        title: p.title,
        area: p.area as string,
        stack: p.stack,
        averageRating: p.averageRating,
        critiqueCount: p.critiqueCount,
        likeCount: p.likeCount,
        previewImageUrl: p.previewImageUrl,
        normalizedUrl: p.normalizedUrl,
        createdAt: p.createdAt,
      })),
      critiquesGiven,
    };
  },
});

// ---------------------------------------------------------------------------
// users.getMe — returns current user profile (authenticated)
// Used by useCurrentUser hook and setup-profile page
// ---------------------------------------------------------------------------

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user ?? null;
  },
});

// ---------------------------------------------------------------------------
// users.getUnreadNotifications
// Auth-aware query for notification badge and login toasts
// ---------------------------------------------------------------------------

export const getUnreadNotifications = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      type: v.union(v.literal("portfolio_offline")),
      title: v.string(),
      message: v.string(),
      portfolioId: v.optional(v.id("portfolios")),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_isRead_and_createdAt", (q) =>
        q.eq("userId", user._id).eq("isRead", false),
      )
      .order("desc")
      .take(10);

    return notifications.map((notification) => ({
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      portfolioId: notification.portfolioId,
      createdAt: notification.createdAt,
    }));
  },
});
