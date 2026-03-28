import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getInternalUser } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getInternalUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = mutation({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    await getInternalUser(ctx);
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Storage ID not found");
    }
    return url;
  },
});
