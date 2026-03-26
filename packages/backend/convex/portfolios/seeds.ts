"use node";

import { internalMutation } from "../_generated/server";
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
    const hasScreenshotProvider = Boolean(process.env.SCREENSHOT_ONE_KEY);

    const portfolioId = await ctx.db.insert("portfolios", {
      authorId: "system" as any,
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
      previewStatus: hasScreenshotProvider ? "pending" : "failed",
      previewAttemptCount: 0,
      urlStatus: "unchecked",
      consecutiveOfflineCount: 0,
      createdAt: Date.now(),
    });

    return portfolioId;
  },
});
