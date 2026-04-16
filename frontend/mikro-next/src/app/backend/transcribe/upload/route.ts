import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.FLASK_BACKEND_URL || "http://localhost:5004";

/**
 * Dedicated file upload proxy for transcription.
 * The generic [...path] proxy can't forward multipart correctly.
 * This route parses the incoming FormData and re-sends it to Flask.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.tokenSet?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse the incoming multipart form data
    const formData = await request.formData();

    // Re-send to Flask — do NOT set Content-Type, let fetch set it
    // with the correct boundary for the new FormData
    const response = await fetch(`${BACKEND_URL}/api/transcribe/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.tokenSet.accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Transcribe upload proxy error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
