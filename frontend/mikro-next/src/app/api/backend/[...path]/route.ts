import { getAccessToken, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.FLASK_BACKEND_URL || "http://localhost:5004";

/**
 * Generic proxy handler for all backend API calls.
 * This route proxies requests to the Flask backend, adding the Auth0 access token.
 *
 * Example: /api/backend/user/fetch_user_role -> BACKEND_URL/api/user/fetch_user_role
 */
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join("/");
    const { accessToken } = await getAccessToken(req, NextResponse.next());

    // Build the backend URL
    const backendUrl = `${BACKEND_URL}/api/${path}`;

    // Get the request body if present
    let body: string | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        body = await req.text();
      } catch {
        body = undefined;
      }
    }

    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: body || undefined,
    });

    // Get the response data
    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Backend proxy error:", error);
    return NextResponse.json(
      { error: "Failed to communicate with backend" },
      { status: 500 }
    );
  }
}

// Export handlers for different HTTP methods
export const GET = withApiAuthRequired(handler);
export const POST = withApiAuthRequired(handler);
export const PUT = withApiAuthRequired(handler);
export const DELETE = withApiAuthRequired(handler);
export const PATCH = withApiAuthRequired(handler);
