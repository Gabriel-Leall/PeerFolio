import { ConvexError, v } from "convex/values";
import { mutation } from "../_generated/server";
import { getInternalUser } from "../lib/auth";

const REPORT_REASONS = [
  "SPAM",
  "PLAGIARISM",
  "DUPLICATE",
  "INAPPROPRIATE",
  "NOT_PORTFOLIO",
  "OFFENSIVE",
  "HARASSMENT",
  "FAKE_REVIEW",
  "OTHER",
] as const;

export const create = mutation({
  args: {
    targetId: v.union(v.id("portfolios"), v.id("critiques")),
    targetType: v.union(v.literal("portfolio"), v.literal("critique")),
    reason: v.union(...REPORT_REASONS.map((r) => v.literal(r))),
    description: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await getInternalUser(ctx);

    let targetOwnerId: string | null = null;

    if (args.targetType === "portfolio") {
      const portfolio = await ctx.db.get(args.targetId);
      if (!portfolio) {
        throw new ConvexError("PORTFOLIO_NOT_FOUND");
      }
      targetOwnerId = portfolio.authorId;
    } else {
      const critique = await ctx.db.get(args.targetId);
      if (!critique) {
        throw new ConvexError("CRITIQUE_NOT_FOUND");
      }
      targetOwnerId = critique.authorId;
    }

    if (targetOwnerId === user._id) {
      throw new ConvexError("CANNOT_REPORT_OWN_CONTENT");
    }

    if (args.reason === "OTHER" && !args.description) {
      throw new ConvexError("DESCRIPTION_REQUIRED_FOR_OTHER");
    }

    await ctx.db.insert("reports", {
      targetId: args.targetId,
      targetType: args.targetType,
      reason: args.reason,
      description: args.description,
      reportedBy: user._id,
      status: "pending",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
