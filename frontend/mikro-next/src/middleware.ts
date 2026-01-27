import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth0 } from "./lib/auth0";

export default async function proxy(request: NextRequest) {
  // Auth0 middleware handles /auth/* routes AND maintains session cookies
  const authRes = await auth0.middleware(request);

  // Let Auth0 fully handle /auth routes
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return authRes;
  }

  // Public routes - pass through with auth cookies maintained
  const publicRoutes = ["/", "/unauthorized"];
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route
  );

  if (isPublicRoute) {
    return authRes;
  }

  // Protected routes require authentication
  const session = await auth0.getSession(request);
  if (!session) {
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  return authRes;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
