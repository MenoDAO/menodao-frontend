import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APEX_HOSTS = new Set(["menodao.org", "www.menodao.org"]);

// Public pages that stay on the marketing origin. Everything else on the apex
// is an app route and is sent to app.menodao.org so localStorage JWTs and
// WebAuthn passkeys are not split across two origins.
const PUBLIC_APEX_PATHS = new Set(["/compliance", "/terms"]);

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!APEX_HOSTS.has(host)) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const normalizedPath =
    pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";

  // Serve the marketing landing page at the apex domain without changing the URL.
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/landing";
    return NextResponse.rewrite(url);
  }

  // Avoid exposing the internal landing route as a duplicate URL.
  if (normalizedPath === "/landing") {
    return NextResponse.redirect(new URL("/", `https://${host}`));
  }

  // Public legal/compliance pages remain on the apex.
  if (PUBLIC_APEX_PATHS.has(normalizedPath)) return NextResponse.next();

  // App routes must run on the app origin so the JWT and passkeys are not
  // re-created under menodao.org.
  const target = new URL(
    `https://app.menodao.org${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(target, 308);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|manifest.webmanifest|sw.js|.*\\..*).*)",
  ],
};
