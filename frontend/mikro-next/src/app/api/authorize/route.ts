import { NextRequest, NextResponse } from "next/server";

/**
 * Handles Auth0 Organization Invitation acceptance.
 * When a user clicks "Accept Invitation" in the email, Auth0 redirects
 * to this route with ?invitation=TICKET&organization=ORG_ID.
 * We construct the Auth0 /authorize URL with these params and redirect.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const invitation = searchParams.get("invitation");
  const organization = searchParams.get("organization");

  if (!organization) {
    return NextResponse.json(
      { error: "Missing required organization parameter" },
      { status: 400 },
    );
  }

  const authorizationUrl = new URL(
    `${process.env.AUTH0_ISSUER_BASE_URL}/authorize`,
  );

  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", process.env.AUTH0_CLIENT_ID!);
  authorizationUrl.searchParams.set("scope", "openid profile email");
  authorizationUrl.searchParams.set("audience", process.env.AUTH0_AUDIENCE!);
  authorizationUrl.searchParams.set(
    "redirect_uri",
    `${process.env.AUTH0_BASE_URL}/auth/callback`,
  );
  authorizationUrl.searchParams.set("organization", organization);

  if (invitation) {
    authorizationUrl.searchParams.set("invitation", invitation);
  }

  return NextResponse.redirect(authorizationUrl.toString());
}
