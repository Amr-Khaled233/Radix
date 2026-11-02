import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Everything except API routes, the dashboard (not locale-prefixed),
  // Next.js internals and files with an extension.
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
