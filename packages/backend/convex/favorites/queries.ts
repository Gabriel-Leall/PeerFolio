import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { getInternalUser } from "../lib/auth";

export const isFavorite = query({
  args: { portfolioId: v.id("portfolios") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getInternalUser(ctx);
    if (!user) return false;

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_userId_portfolioId", (q) =>
        q.eq("userId", user._id).eq("portfolioId", args.portfolioId),
      )
      .unique();

    return !!favorite;
  },
});

export const listByUser = query({
  args: {
    userId: v.id("users"),
    numItems: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    favorites: v.array(v.id("portfolios")),
    continueCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getInternalUser(ctx);
    if (user._id !== args.userId) {
      return {
        favorites: [],
        continueCursor: undefined,
      };
    }

    const numItems = args.numItems ?? 20;
    
    const paginationResult = await ctx.db
      .query("favorites")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .paginate({ numItems, cursor: args.cursor ?? null });

    return {
      favorites: paginationResult.page.map((r) => r.portfolioId as Id<"portfolios">),
      continueCursor: paginationResult.continueCursor ?? undefined,
    };
  },
});
