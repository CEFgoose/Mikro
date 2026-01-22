import { Auth0Client } from "@auth0/nextjs-auth0/server";

// SDK v4 reads these env vars automatically:
// AUTH0_SECRET, AUTH0_ISSUER_BASE_URL, AUTH0_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET
export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: "openid profile email",
  },
});
