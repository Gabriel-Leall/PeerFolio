import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";
import { AREA_VALUES } from "../lib/constants";
import { getInternalUser } from "../lib/auth";

const areaValidator = v.union(
  v.literal("Frontend"),
  v.literal("Backend"),
  v.literal("Fullstack"),
  v.literal("UI/UX"),
  v.literal("Mobile"),
  v.literal("Other"),
);

const NICKNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export const upsertProfile = mutation({
  args: {
    nickname: v.optional(v.string()),
    primaryArea: v.optional(areaValidator),
    bio: v.optional(v.string()),
    stackTags: v.optional(v.array(v.string())),
    availabilityStatus: v.optional(
      v.union(v.literal("available"), v.literal("unavailable")),
    ),
    socialLinks: v.optional(
      v.object({
        github: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        website: v.optional(v.string()),
      }),
    ),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const user = await getInternalUser(ctx);

    // Validate nickname if provided
    if (args.nickname !== undefined) {
      if (!NICKNAME_REGEX.test(args.nickname)) {
        throw new ConvexError("INVALID_NICKNAME");
      }

      // Check nickname uniqueness (excluding current user)
      const existingWithNickname = await ctx.db
        .query("users")
        .filter((q) =>
          q.and(
            q.eq(q.field("nickname"), args.nickname),
            q.neq(q.field("_id"), user._id),
          ),
        )
        .first();

      if (existingWithNickname !== null) {
        throw new ConvexError("NICKNAME_TAKEN");
      }
    }

    // Validate bio length
    if ((args.bio ?? "").length > 160) {
      throw new ConvexError("BIO_TOO_LONG");
    }

    const patch: Record<string, unknown> = {};

    if (args.nickname !== undefined) patch.nickname = args.nickname;
    if (args.primaryArea !== undefined) patch.primaryArea = args.primaryArea;
    if (args.bio !== undefined) patch.bio = args.bio;
    if (args.stackTags !== undefined) patch.stackTags = args.stackTags;
    if (args.availabilityStatus !== undefined)
      patch.availabilityStatus = args.availabilityStatus;
    if (args.socialLinks !== undefined) patch.socialLinks = args.socialLinks;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }

    return user._id;
  },
});
