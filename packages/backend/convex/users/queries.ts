import { query } from "../_generated/server";
import { getInternalUser } from "../lib/auth";
import { v } from "convex/values";

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getInternalUser(ctx);
      return user;
    } catch {
      return null;
    }
  },
});
