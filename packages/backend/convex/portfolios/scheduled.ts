import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { isSafeUrl } from "../lib/urlUtils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 8_000;
const MAX_PREVIEW_ATTEMPTS = 3;
const OFFLINE_ARCHIVE_THRESHOLD = 30; // consecutive offline → archive
const ONLINE_BADGE_THRESHOLD = 3; // consecutive offline → show badge
const HEALTH_CHECK_BATCH_SIZE = 100;

// ---------------------------------------------------------------------------
// updatePreviewResult — internal mutation to write preview result to DB
// ---------------------------------------------------------------------------

export const updatePreviewResult = internalMutation({
  args: {
    portfolioId: v.id("portfolios"),
    previewImageUrl: v.optional(v.string()),
    status: v.union(v.literal("success"), v.literal("failed")),
    attemptCount: v.number(),
  },
  handler: async (
    ctx,
    { portfolioId, previewImageUrl, status, attemptCount },
  ) => {
    if (status === "success" && previewImageUrl) {
      await ctx.db.patch(portfolioId, {
        previewImageUrl,
        previewStatus: "success",
        previewAttemptCount: attemptCount,
      });
    } else {
      await ctx.db.patch(portfolioId, {
        previewStatus:
          attemptCount >= MAX_PREVIEW_ATTEMPTS ? "failed" : "pending",
        previewAttemptCount: attemptCount,
      });
    }
  },
});

// ---------------------------------------------------------------------------
// T036 — generatePreview: fires after portfolio insert
// Calls Microlink API; retries up to 3x with exponential back-off
// ---------------------------------------------------------------------------

export const generatePreview = internalAction({
  args: {
    portfolioId: v.id("portfolios"),
    normalizedUrl: v.string(),
    attemptCount: v.number(),
  },
  handler: async (ctx, { portfolioId, normalizedUrl, attemptCount }) => {
    const newAttemptCount = attemptCount + 1;

    const microlinkUrl =
      `https://api.microlink.io/` +
      `?url=${encodeURIComponent(normalizedUrl)}` +
      `&screenshot=true` +
      `&meta=false`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(microlinkUrl, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Microlink API returned ${response.status}`);
      }

      const data = (await response.json()) as {
        data?: {
          screenshot?: {
            url?: string;
          };
        };
      };
      const previewImageUrl = data.data?.screenshot?.url;

      if (!previewImageUrl) {
        throw new Error("No URL in screenshot response");
      }

      await ctx.runMutation(internal.portfolios.scheduled.updatePreviewResult, {
        portfolioId,
        previewImageUrl,
        status: "success",
        attemptCount: newAttemptCount,
      });
    } catch {
      // Schedule retry if under max attempts
      if (newAttemptCount < MAX_PREVIEW_ATTEMPTS) {
        // Exponential backoff: 15min → 1h → 24h
        const delayMs =
          newAttemptCount === 1
            ? 15 * 60 * 1000
            : newAttemptCount === 2
              ? 60 * 60 * 1000
              : 24 * 60 * 60 * 1000;

        await ctx.scheduler.runAfter(
          delayMs,
          internal.portfolios.scheduled.generatePreview,
          { portfolioId, normalizedUrl, attemptCount: newAttemptCount },
        );
      } else {
        // Max retries reached — mark as failed
        await ctx.runMutation(
          internal.portfolios.scheduled.updatePreviewResult,
          {
            portfolioId,
            status: "failed",
            attemptCount: newAttemptCount,
          },
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }
  },
});

// ---------------------------------------------------------------------------
// updateUrlHealthResult — internal mutation to write URL health to DB
// ---------------------------------------------------------------------------

export const updateUrlHealthResult = internalMutation({
  args: {
    portfolioId: v.id("portfolios"),
    healthStatus: v.union(
      v.literal("online"),
      v.literal("offline"),
      v.literal("unchecked"),
    ),
    currentConsecutiveOfflineCount: v.number(),
    authorId: v.id("users"),
    normalizedUrl: v.string(),
  },
  handler: async (
    ctx,
    {
      portfolioId,
      healthStatus,
      currentConsecutiveOfflineCount,
      authorId,
      normalizedUrl,
    },
  ) => {
    if (healthStatus === "online") {
      await ctx.db.patch(portfolioId, {
        urlStatus: "online",
        consecutiveOfflineCount: 0,
      });
      return;
    }

    if (healthStatus === "unchecked") {
      await ctx.db.patch(portfolioId, {
        urlStatus: "unchecked",
      });
      return;
    }

    {
      const newOfflineCount = currentConsecutiveOfflineCount + 1;

      // After 30 consecutive offline days → archive
      if (newOfflineCount >= OFFLINE_ARCHIVE_THRESHOLD) {
        await ctx.db.patch(portfolioId, {
          urlStatus: "offline",
          consecutiveOfflineCount: newOfflineCount,
          isArchived: true,
        });
      } else {
        await ctx.db.patch(portfolioId, {
          urlStatus: "offline",
          consecutiveOfflineCount: newOfflineCount,
        });
      }

      // When a portfolio crosses the offline warning threshold, create one notification.
      if (
        currentConsecutiveOfflineCount < ONLINE_BADGE_THRESHOLD &&
        newOfflineCount >= ONLINE_BADGE_THRESHOLD
      ) {
        const existingNotification = await ctx.db
          .query("notifications")
          .withIndex("by_userId_and_type_and_portfolioId", (q) =>
            q
              .eq("userId", authorId)
              .eq("type", "portfolio_offline")
              .eq("portfolioId", portfolioId),
          )
          .first();

        if (existingNotification === null) {
          await ctx.db.insert("notifications", {
            userId: authorId,
            type: "portfolio_offline",
            title: "Portfolio possivelmente offline",
            message: `Seu portfolio ${normalizedUrl} ficou offline por ${newOfflineCount} verificacoes consecutivas.`,
            portfolioId,
            isRead: false,
            createdAt: Date.now(),
          });
        }
      }
    }
  },
});

// ---------------------------------------------------------------------------
// T037 — checkUrlHealth: HEAD request on a single portfolio's normalizedUrl
// Called by the cron (checkAllUrlHealth) once per day per portfolio
// ---------------------------------------------------------------------------

export const checkUrlHealth = internalAction({
  args: {
    portfolioId: v.id("portfolios"),
    normalizedUrl: v.string(),
    consecutiveOfflineCount: v.number(),
    authorId: v.id("users"),
  },
  handler: async (
    ctx,
    { portfolioId, normalizedUrl, consecutiveOfflineCount, authorId },
  ) => {
    if (!isSafeUrl(normalizedUrl)) {
      return; // Skip unsafe URLs (shouldn't happen, but guard anyway)
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let healthStatus: "online" | "offline" | "unchecked" = "unchecked";

    try {
      const response = await fetch(normalizedUrl, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      });

      if (response.status >= 200 && response.status < 400) {
        healthStatus = "online";
      } else if (response.status >= 500 || response.status === 429) {
        healthStatus = "offline";
      } else {
        // 4xx often indicates anti-bot/rate-limit/policy blocks, not necessarily offline.
        healthStatus = "unchecked";
      }
    } catch {
      // Network error or timeout → treat as offline
      healthStatus = "offline";
    } finally {
      clearTimeout(timeoutId);
    }

    await ctx.runMutation(internal.portfolios.scheduled.updateUrlHealthResult, {
      portfolioId,
      healthStatus,
      currentConsecutiveOfflineCount: consecutiveOfflineCount,
      authorId,
      normalizedUrl,
    });
  },
});

// ---------------------------------------------------------------------------
// checkAllUrlHealth — internal action fanned out from cron
// Iterates all active portfolios and schedules individual health checks
// ---------------------------------------------------------------------------

export const checkAllUrlHealth = internalAction({
  args: {
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const portfolios = await ctx.runQuery(
      internal.portfolios.scheduled.listActivePortfoliosForHealthCheck,
      {
        paginationOpts: {
          numItems: HEALTH_CHECK_BATCH_SIZE,
          cursor: args.cursor ?? null,
        },
      },
    );

    for (const portfolio of portfolios.page) {
      await ctx.scheduler.runAfter(
        0,
        internal.portfolios.scheduled.checkUrlHealth,
        {
          portfolioId: portfolio._id,
          normalizedUrl: portfolio.normalizedUrl,
          consecutiveOfflineCount: portfolio.consecutiveOfflineCount ?? 0,
          authorId: portfolio.authorId,
        },
      );
    }

    if (!portfolios.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.portfolios.scheduled.checkAllUrlHealth,
        { cursor: portfolios.continueCursor },
      );
    }
  },
});

// ---------------------------------------------------------------------------
// listActivePortfoliosForHealthCheck — internal query used by the cron fan-out
// ---------------------------------------------------------------------------

export const listActivePortfoliosForHealthCheck = internalQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const paginated = await ctx.db
      .query("portfolios")
      .withIndex("by_isDeleted_and_isArchived_and_createdAt", (q) =>
        q.eq("isDeleted", false).eq("isArchived", false),
      )
      .order("asc")
      .paginate(args.paginationOpts);

    return {
      ...paginated,
      page: paginated.page.map((p) => ({
        _id: p._id,
        normalizedUrl: p.normalizedUrl,
        consecutiveOfflineCount: p.consecutiveOfflineCount ?? 0,
        authorId: p.authorId,
      })),
    };
  },
});

// ---------------------------------------------------------------------------
// Retry delay helpers (exported for tests)
// ---------------------------------------------------------------------------

export const RETRY_DELAYS_MS = [
  15 * 60 * 1000, // 15 min
  60 * 60 * 1000, // 1 hour
  24 * 60 * 60 * 1000, // 24 hours
] as const;

export {
  ONLINE_BADGE_THRESHOLD,
  OFFLINE_ARCHIVE_THRESHOLD,
  MAX_PREVIEW_ATTEMPTS,
};
