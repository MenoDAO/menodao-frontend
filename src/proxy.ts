import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APEX_HOSTS = new Set(["menodao.org", "www.menodao.org"]);

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!APEX_HOSTS.has(host)) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Serve the marketing landing page at the apex domain without changing the URL.
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/landing";
    return NextResponse.rewrite(url);
  }

  // Avoid exposing the internal landing route as a duplicate URL.
  if (pathname === "/landing") {
    return NextResponse.redirect(new URL("/", `https://${host}`));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/landing"],
};
