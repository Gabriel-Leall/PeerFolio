import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadString = await request.text();
    const evt = JSON.parse(payloadString);

    const { id } = evt.data || {};
    const eventType = evt.type;

    if (id && (eventType === "user.created" || eventType === "user.updated")) {
      const nickname = evt.data.username || evt.data.first_name || undefined;
      const avatarUrl = evt.data.image_url || undefined;

      await ctx.runMutation(internal.users.sync.syncUser, {
        clerkId: id,
        nickname,
        avatarUrl,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

http.route({
  path: "/storage-url",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const storageId = url.searchParams.get("id");

    if (!storageId) {
      return new Response("Missing id parameter", { status: 400 });
    }

    const storageUrl = await ctx.storage.getUrl(storageId);

    if (!storageUrl) {
      return new Response("Storage ID not found", { status: 404 });
    }

    return new Response(JSON.stringify(storageUrl), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
