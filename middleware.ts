import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/auth/session";

const SESSION_COOKIE_NAME = "todo-session";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Allow public routes through
  if (pathname === "/login" || pathname.startsWith("/api/cron/")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, {
    password: process.env.SESSION_SECRET!,
    cookieName: SESSION_COOKIE_NAME,
  });

  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|sw\\.js\\.map|icon-\\d+\\.png|apple-touch-icon\\.png|favicon\\.png|icon\\.svg|manifest).*)",
  ],
};
