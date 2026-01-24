import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth0 } from "./lib/auth0";

export default async function proxy(request: NextRequest) {
  // Only call Auth0 middleware for /auth routes
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return auth0.middleware(request);
  }

  // Public routes that don't need authentication
  const publicRoutes = ["/", "/unauthorized"];
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes require authentication
  const session = await auth0.getSession(request);
  if (!session) {
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  return NextResponse.next();
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
