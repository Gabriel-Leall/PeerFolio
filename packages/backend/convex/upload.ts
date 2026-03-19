import { mutation } from "./_generated/server";
import { getInternalUser } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Ensure the user is authenticated
    await getInternalUser(ctx);

    // Return a short-lived upload URL
    return await ctx.storage.generateUploadUrl();
  },
});
