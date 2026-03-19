import { ConvexError, v } from "convex/values";

import { action } from "../_generated/server";
import { isSafeUrl, normalizeUrl } from "../lib/urlUtils";

const FETCH_TIMEOUT_MS = 8_000;

export const validateUrl = action({
  args: {
    url: v.string(),
  },
  returns: v.object({
    normalizedUrl: v.string(),
    reachable: v.boolean(),
    statusCode: v.optional(v.number()),
  }),
  handler: async (_ctx, { url }) => {
    let normalizedUrl: string;

    try {
      normalizedUrl = normalizeUrl(url);
    } catch {
      throw new ConvexError("INVALID_URL");
    }

    if (!isSafeUrl(normalizedUrl)) {
      throw new ConvexError("UNSAFE_URL");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      // Try HEAD first, fall back to GET if HEAD returns 405 or similar issues
      let response: Response;

      try {
        response = await fetch(normalizedUrl, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "follow",
        });
      } catch {
        // HEAD failed — try GET
        response = await fetch(normalizedUrl, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
        });
      }

      const statusCode = response.status;
      const reachable = statusCode >= 200 && statusCode < 400;

      return { normalizedUrl, reachable, statusCode };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return { normalizedUrl, reachable: false };
      }

      // Network error — URL unreachable
      return { normalizedUrl, reachable: false };
    } finally {
      clearTimeout(timeoutId);
    }
  },
});
