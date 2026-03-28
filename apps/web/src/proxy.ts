import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@PeerFolio/backend/convex/_generated/api";

const isProtectedRoute = createRouteMatcher(["/submit(.*)", "/setup-profile(.*)"]);
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const convex = new ConvexHttpClient(convexUrl);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const authObj = await auth();
    if (!authObj.userId) {
      return authObj.redirectToSignIn();
    }

    if (!req.nextUrl.pathname.startsWith("/setup-profile")) {
      try {
        const token = await authObj.getToken({ template: "convex" });
        if (token) {
          convex.setAuth(token);
          const user = await convex.query(api.users.queries.getProfile, {
            userId: authObj.userId,
          });
          if (user && !user.nickname) {
            const url = new URL("/setup-profile", req.url);
            url.searchParams.set("redirect", req.nextUrl.pathname);
            return Response.redirect(url, 302);
          }
        }
      } catch (error) {
        console.error("Proxy Convex check failed:", error);
      }
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
