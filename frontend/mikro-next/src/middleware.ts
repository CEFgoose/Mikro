import { getSession } from "@auth0/nextjs-auth0/edge";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const session = await getSession(request, response);

    const { pathname } = request.nextUrl;

    // Check if accessing protected routes
    const protectedPaths = ["/admin", "/validator", "/user", "/account", "/onboarding"];
    const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

    if (isProtectedPath) {
      if (!session) {
        // Redirect to login if not authenticated
        return NextResponse.redirect(new URL("/api/auth/login", request.url));
      }

      // Get user role from Auth0 custom claims
      const userRole = session.user?.["mikro/roles"]?.[0] || "user";

      // Role-based route protection
      if (pathname.startsWith("/admin") && userRole !== "admin") {
        // Non-admins trying to access admin routes
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      if (
        pathname.startsWith("/validator") &&
        !["admin", "validator"].includes(userRole)
      ) {
        // Non-validators trying to access validator routes
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, redirect to login
    return NextResponse.redirect(new URL("/api/auth/login", request.url));
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/validator/:path*",
    "/user/:path*",
    "/account/:path*",
    "/onboarding/:path*",
  ],
};
