import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Subdomain rewrite: dashboard.wjp.studio serves /dashboard as root
  const isDashboardSubdomain =
    host === "dashboard.wjp.studio" || host.startsWith("dashboard.wjp.studio:");

  if (isDashboardSubdomain && pathname === "/") {
    // Rewrite root to /dashboard (not redirect, keeps URL as dashboard.wjp.studio/)
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    // Still check auth before rewriting
    const auth = request.cookies.get("dashboard_auth");
    if (!auth || auth.value !== "1") {
      // Show the login page (splash) at /
      return NextResponse.next();
    }
    return NextResponse.rewrite(url);
  }

  // Public routes — splash page and auth API only
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/dashboard-data") ||
    pathname.startsWith("/api/dashboard-auth") ||
    pathname.startsWith("/api/agent-sync") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/pfp") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Everything else requires auth
  const auth = request.cookies.get("dashboard_auth");
  if (!auth || auth.value !== "1") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
