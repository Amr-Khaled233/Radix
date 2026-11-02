import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./lib/i18n/routing";

const intl = createMiddleware(routing);

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // UX only: send signed-out visitors to the login page. Every dashboard page,
    // Server Action and route handler still verifies the session itself.
    const isPublic = PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path));
    if (!isPublic && !getSessionCookie(request, { cookiePrefix: "radix" })) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  return intl(request);
}

export const config = {
  // Everything except API routes, Next.js internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
