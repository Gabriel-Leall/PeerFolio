import { ConvexError, v } from "convex/values";
import { mutation } from "../_generated/server";
import { getInternalUser } from "../lib/auth";

export const toggle = mutation({
  args: {
    portfolioId: v.id("portfolios"),
  },
  returns: v.object({
    liked: v.boolean(),
    likeCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getInternalUser(ctx);

    const portfolio = await ctx.db.get(args.portfolioId);
    if (!portfolio || portfolio.isDeleted) {
      throw new ConvexError("PORTFOLIO_NOT_FOUND");
    }

    // Prevents self-like
    if (portfolio.authorId === user._id) {
      throw new ConvexError("CANNOT_LIKE_OWN_PORTFOLIO");
    }

    const existingLike = await ctx.db
      .query("portfolioLikes")
      .withIndex("by_portfolioId_userId", (q) =>
        q.eq("portfolioId", args.portfolioId).eq("userId", user._id),
      )
      .unique();

    let newLikeCount = portfolio.likeCount;
    let newLikedState = false;

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      newLikeCount = Math.max(0, newLikeCount - 1);
      newLikedState = false;
      
      // Update author's upvotesReceivedCount
      const author = await ctx.db.get(portfolio.authorId);
      if (author) {
        await ctx.db.patch(author._id, {
          upvotesReceivedCount: Math.max(0, author.upvotesReceivedCount - 1),
        });
      }
    } else {
      // Like
      await ctx.db.insert("portfolioLikes", {
        portfolioId: args.portfolioId,
        userId: user._id,
        createdAt: Date.now(),
      });
      newLikeCount += 1;
      newLikedState = true;
      
      // Update author's upvotesReceivedCount
      const author = await ctx.db.get(portfolio.authorId);
      if (author) {
        await ctx.db.patch(author._id, {
          upvotesReceivedCount: author.upvotesReceivedCount + 1,
        });
      }
    }

    // Update portfolio likeCount
    await ctx.db.patch(args.portfolioId, {
      likeCount: newLikeCount,
    });

    return {
      liked: newLikedState,
      likeCount: newLikeCount,
    };
  },
});
