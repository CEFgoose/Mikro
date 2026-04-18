import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

// Pinged by useSessionHeartbeat every 15 minutes while the tab is visible.
// auth0.getAccessToken() transparently uses the refresh token if the access
// token is expired (or close to it), and the route handler persists the
// updated session cookie. This keeps the session alive in the background
// even when the user isn't navigating.
export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, reason: "session_expired" },
        { status: 401 },
      );
    }

    const { expiresAt } = await auth0.getAccessToken();
    return NextResponse.json({ ok: true, expiresAt });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "");
    console.error("[heartbeat] Token refresh failed:", message);

    const lower = message.toLowerCase();
    const isSessionDead =
      lower.includes("refresh token") ||
      lower.includes("invalid_grant") ||
      lower.includes("session") ||
      lower.includes("not authenticated") ||
      lower.includes("login required");

    return NextResponse.json(
      {
        ok: false,
        reason: isSessionDead ? "session_expired" : "refresh_error",
        message,
      },
      { status: isSessionDead ? 401 : 500 },
    );
  }
}
