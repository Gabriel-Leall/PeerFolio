import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";
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

export const submit = mutation({
  args: {
    url: v.string(),
    title: v.string(),
    area: areaValidator,
    stack: v.array(v.string()),
    goalsContext: v.optional(v.string()),
  },
  returns: v.object({ portfolioId: v.id("portfolios") }),
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
      .withIndex("by_normalizedUrl", (q) => q.eq("normalizedUrl", normalizedUrl))
      .first();

    if (existing !== null && !existing.isDeleted) {
      throw new ConvexError({
        code: "DUPLICATE_URL",
        existingPortfolioId: existing._id,
      });
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
      isDeleted: false,
      createdAt: now,
    });

    // Increment user's portfoliosCount
    await ctx.db.patch(user._id, {
      portfoliosCount: user.portfoliosCount + 1,
    });

    return { portfolioId };
  },
});
