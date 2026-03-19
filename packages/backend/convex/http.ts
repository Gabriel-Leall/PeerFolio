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

export default http;
