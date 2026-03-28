import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { AREA_VALUES } from "./lib/constants";

const areaValidator = v.union(
  v.literal(AREA_VALUES[0]),
  v.literal(AREA_VALUES[1]),
  v.literal(AREA_VALUES[2]),
  v.literal(AREA_VALUES[3]),
  v.literal(AREA_VALUES[4]),
  v.literal(AREA_VALUES[5]),
);

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    nickname: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    primaryArea: v.optional(areaValidator),
    stackTags: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
    availabilityStatus: v.union(
      v.literal("available"),
      v.literal("unavailable"),
    ),
    socialLinks: v.optional(
      v.object({
        github: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        website: v.optional(v.string()),
        twitter: v.optional(v.string()),
      }),
    ),
    portfoliosCount: v.number(),
    critiquesGivenCount: v.number(),
    upvotesReceivedCount: v.number(),
    reputationScore: v.optional(v.number()),
    totalUpvotesReceived: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  portfolios: defineTable({
    authorId: v.id("users"),
    url: v.string(),
    normalizedUrl: v.string(),
    title: v.string(),
    area: areaValidator,
    stack: v.array(v.string()),
    goalsContext: v.optional(v.string()),
    previewImageUrl: v.optional(v.string()),
    averageRating: v.number(),
    critiqueCount: v.number(),
    likeCount: v.number(),
    topRatedScore: v.number(),
    lastCritiqueAt: v.optional(v.number()),

    // Preview Status
    previewStatus: v.optional(
      v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
    ),
    previewAttemptCount: v.optional(v.number()),

    // URL Health
    urlStatus: v.optional(
      v.union(
        v.literal("online"),
        v.literal("offline"),
        v.literal("unchecked"),
      ),
    ),
    consecutiveOfflineCount: v.optional(v.number()),

    isDeleted: v.boolean(),
    isArchived: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    isSeeded: v.optional(v.boolean()),
  })
    .index("by_authorId", ["authorId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_isDeleted_and_isArchived_and_createdAt", [
      "isDeleted",
      "isArchived",
      "createdAt",
    ])
    .index("by_topRatedScore", ["topRatedScore"])
    .index("by_lastCritiqueAt", ["lastCritiqueAt"])
    .index("by_normalizedUrl", ["normalizedUrl"])
    .index("by_isSeeded_and_normalizedUrl", ["isSeeded", "normalizedUrl"]),

  critiqueUpvotes: defineTable({
    critiqueId: v.id("critiques"),
    userId: v.id("users"),
    createdAt: v.number(),
  }).index("by_critiqueId_userId", ["critiqueId", "userId"]),

  critiques: defineTable({
    portfolioId: v.id("portfolios"),
    authorId: v.id("users"),
    rating: v.number(),
    feedback: v.string(),
    upvotes: v.number(),
    createdAt: v.number(),
  })
    .index("by_portfolioId", ["portfolioId"])
    .index("by_authorId", ["authorId"])
    .index("by_authorId_and_createdAt", ["authorId", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  portfolioLikes: defineTable({
    portfolioId: v.id("portfolios"),
    userId: v.id("users"),
    createdAt: v.number(),
  }).index("by_portfolioId_userId", ["portfolioId", "userId"]),

  favorites: defineTable({
    portfolioId: v.id("portfolios"),
    userId: v.id("users"),
    createdAt: v.number(),
  }).index("by_userId_portfolioId", ["userId", "portfolioId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  reports: defineTable({
    targetId: v.union(v.id("portfolios"), v.id("critiques")),
    targetType: v.union(v.literal("portfolio"), v.literal("critique")),
    reason: v.union(
      v.literal("SPAM"),
      v.literal("PLAGIARISM"),
      v.literal("DUPLICATE"),
      v.literal("INAPPROPRIATE"),
      v.literal("NOT_PORTFOLIO"),
      v.literal("OFFENSIVE"),
      v.literal("HARASSMENT"),
      v.literal("FAKE_REVIEW"),
      v.literal("OTHER")
    ),
    description: v.optional(v.string()),
    reportedBy: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("dismissed")),
    createdAt: v.number(),
  }).index("by_targetId", ["targetId"])
    .index("by_reportedBy_createdAt", ["reportedBy", "createdAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("portfolio_offline")),
    title: v.string(),
    message: v.string(),
    portfolioId: v.optional(v.id("portfolios")),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId_and_isRead_and_createdAt", [
      "userId",
      "isRead",
      "createdAt",
    ])
    .index("by_userId_and_type_and_portfolioId", [
      "userId",
      "type",
      "portfolioId",
    ]),
});
