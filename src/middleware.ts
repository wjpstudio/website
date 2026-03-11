import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/dashboard", "/api/dashboard-auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths, static assets, and Next.js internals
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const auth = req.cookies.get("dashboard_auth");
  if (auth?.value === "1") {
    return NextResponse.next();
  }

  // Not authenticated - redirect to dashboard (has the login form)
  const loginUrl = new URL("/dashboard", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
