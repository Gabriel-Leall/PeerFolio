import { ConvexError, v } from "convex/values";
import { mutation } from "../_generated/server";
import { getInternalUser } from "../lib/auth";

export const toggle = mutation({
  args: {
    portfolioId: v.id("portfolios"),
  },
  handler: async (ctx, { portfolioId }) => {
    const user = await getInternalUser(ctx);
    const portfolio = await ctx.db.get(portfolioId);

    if (!portfolio || portfolio.isDeleted) {
      throw new ConvexError("PORTFOLIO_NOT_FOUND");
    }

    if (portfolio.authorId === user._id) {
      throw new ConvexError("CANNOT_LIKE_OWN_PORTFOLIO");
    }

    const existingLike = await ctx.db
      .query("portfolioLikes")
      .withIndex("by_portfolioId_userId", (q) =>
        q.eq("portfolioId", portfolioId).eq("userId", user._id),
      )
      .unique();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      
      const newLikeCount = Math.max(0, portfolio.likeCount - 1);
      await ctx.db.patch(portfolioId, {
        likeCount: newLikeCount,
      });

      return { liked: false, likeCount: newLikeCount };
    } else {
      // Like
      await ctx.db.insert("portfolioLikes", {
        portfolioId,
        userId: user._id,
        createdAt: Date.now(),
      });

      const newLikeCount = portfolio.likeCount + 1;
      await ctx.db.patch(portfolioId, {
        likeCount: newLikeCount,
      });

      return { liked: true, likeCount: newLikeCount };
    }
  },
});
