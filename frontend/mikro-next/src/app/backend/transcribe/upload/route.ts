import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.FLASK_BACKEND_URL || "http://localhost:5004";

/**
 * Dedicated upload + transcribe proxy.
 * Forwards the file to Flask which transcribes synchronously and returns
 * the result. Long timeout since transcription can take minutes.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.tokenSet?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    const rawBody = Buffer.from(await request.arrayBuffer());

    console.log("[transcribe-upload] Proxying file upload:", {
      contentType: contentType.slice(0, 80),
      bodySize: rawBody.length,
    });

    // 10 minute timeout — transcription of long files can take a while
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10 * 60 * 1000);

    try {
      const response = await fetch(`${BACKEND_URL}/api/transcribe/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.tokenSet.accessToken}`,
          "Content-Type": contentType,
          "Content-Length": String(rawBody.length),
        },
        body: rawBody,
        signal: controller.signal,
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return NextResponse.json(data, { status: response.status });
      } catch {
        // Flask returned HTML error page — pass through the raw text
        console.error("[transcribe-upload] Non-JSON response from backend:", text.slice(0, 500));
        return NextResponse.json(
          { error: `Backend error (${response.status}): ${text.slice(0, 300)}` },
          { status: response.status },
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("Transcribe upload proxy error:", error);
    const message = error instanceof Error && error.name === "AbortError"
      ? "Transcription timed out after 10 minutes"
      : `Upload proxy failed: ${error instanceof Error ? error.message : String(error)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
