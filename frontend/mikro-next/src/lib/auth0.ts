import { Auth0Client } from "@auth0/nextjs-auth0/server";

// SDK v4 reads these env vars automatically:
// AUTH0_SECRET, AUTH0_ISSUER_BASE_URL, AUTH0_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET
export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: "openid profile email",
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
});
