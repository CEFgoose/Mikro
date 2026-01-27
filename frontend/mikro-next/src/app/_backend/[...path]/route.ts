import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.FLASK_BACKEND_URL || "http://localhost:5004";

/**
 * Generic proxy handler for all backend API calls.
 * This route proxies requests to the Flask backend, adding the Auth0 access token.
 *
 * Example: /_backend/user/fetch_user_role -> BACKEND_URL/api/user/fetch_user_role
 */
async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await auth0.getSession(request);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { path } = await params;
    const backendPath = path.join("/");
    const url = new URL(request.url);
    const queryString = url.search;

    const backendUrl = `${BACKEND_URL}/api/${backendPath}${queryString}`;

    // Get the access token from session
    const accessToken = session.tokenSet?.accessToken;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const body = request.method !== "GET" ? await request.text() : undefined;

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Backend proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy request to backend" },
      { status: 500 }
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
