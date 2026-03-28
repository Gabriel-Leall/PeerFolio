import { ConvexError, v } from "convex/values";
import { mutation } from "../_generated/server";
import { getInternalUser } from "../lib/auth";

export const toggle = mutation({
  args: { portfolioId: v.id("portfolios") },
  returns: v.object({
    favorited: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getInternalUser(ctx);

    const portfolio = await ctx.db.get(args.portfolioId);
    if (!portfolio || portfolio.isDeleted) {
      throw new ConvexError("PORTFOLIO_NOT_FOUND");
    }

    const existingFavorite = await ctx.db
      .query("favorites")
      .withIndex("by_userId_portfolioId", (q) =>
        q.eq("userId", user._id).eq("portfolioId", args.portfolioId),
      )
      .unique();

    if (existingFavorite) {
      await ctx.db.delete(existingFavorite._id);
      return { favorited: false };
    } else {
      await ctx.db.insert("favorites", {
        portfolioId: args.portfolioId,
        userId: user._id,
        createdAt: Date.now(),
      });
      return { favorited: true };
    }
  },
});
