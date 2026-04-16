import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.FLASK_BACKEND_URL || "http://localhost:5004";

/**
 * Dedicated file upload proxy for transcription.
 * Reads the raw body as a Buffer and forwards it with the original
 * Content-Type header intact.
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

    const response = await fetch(`${BACKEND_URL}/api/transcribe/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.tokenSet.accessToken}`,
        "Content-Type": contentType,
        "Content-Length": String(rawBody.length),
      },
      body: rawBody,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Transcribe upload proxy error:", error);
    return NextResponse.json(
      { error: `Upload proxy failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    );
  }
}
