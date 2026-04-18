import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";

// Long-lived rolling sessions with proactive token refresh:
// - rolling: session extends while active within inactivityDuration
// - inactivityDuration 7d: idle tab cap
// - absoluteDuration 30d: hard cap regardless of activity
// - offline_access scope issues the refresh token used by getAccessToken()
// - useSessionHeartbeat (client) pings /api/auth/heartbeat every 15 min to keep
//   the access token fresh; fetchWithAuth catches 401s as a safety net
// Requires Auth0 dashboard: Refresh Token Rotation + Reuse Detection enabled,
// Refresh Token Absolute Lifetime >= 30 days, Inactivity Lifetime >= 7 days.
export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: "openid profile email offline_access",
  },
  session: {
    rolling: true,
    inactivityDuration: 60 * 60 * 24 * 7,
    absoluteDuration: 60 * 60 * 24 * 30,
  },
  async beforeSessionSaved(session) {
    // In SDK v4, session.user contains all ID token claims including custom ones
    // Preserve mikro/roles and other custom claims
    return {
      ...session,
      user: {
        ...session.user,
        // Ensure custom claims are preserved (they should already be there)
        "mikro/roles": session.user["mikro/roles"],
      },
    };
  },
  // Reject logins where the user has no org_id — happens with test accounts or
  // invitations that weren't tied to an Auth0 organization. Without this check
  // the user lands on a blank app or a raw error page with no way back.
  async onCallback(error, ctx, session) {
    // Auth0 SDK v4 reads APP_BASE_URL at client init; use the same here instead
    // of AUTH0_BASE_URL (which is the v3 name and may not be populated on prod).
    // Keep AUTH0_BASE_URL as a compat fallback so local .env.local still works.
    const baseUrl = process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL;
    if (!baseUrl) {
      throw new Error(
        "APP_BASE_URL is not set — cannot build redirect URL in onCallback",
      );
    }
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/unauthorized?error=${encodeURIComponent(error.code || error.message)}`,
          baseUrl,
        ),
      );
    }
    if (session && !session.user.org_id) {
      return NextResponse.redirect(new URL("/no-org", baseUrl));
    }
    return NextResponse.redirect(new URL(ctx.returnTo ?? "/", baseUrl));
  },
});
