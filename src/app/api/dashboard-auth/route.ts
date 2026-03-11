import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { error: "Dashboard password not configured" },
      { status: 500 }
    );
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  const cookieOptions = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  };

  // httpOnly cookie for middleware auth check
  response.cookies.set("dashboard_auth", "1", {
    ...cookieOptions,
    httpOnly: true,
  });

  // Readable cookie so client nav can show/hide links
  response.cookies.set("dashboard_ui", "1", {
    ...cookieOptions,
    httpOnly: false,
  });

  return response;
}
