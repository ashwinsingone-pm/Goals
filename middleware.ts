import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // If no token and trying to access protected route, redirect to login
  // (dev: ?preview=1 bypasses auth check)
  if (!token && !request.nextUrl.pathname.startsWith("/login") && !request.nextUrl.searchParams.get("preview")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If token exists and trying to access login, redirect to dashboard
  if (token && request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/ (API routes handle auth themselves and return 401, not redirect)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/|_next/static|_next/image|favicon.ico).*)",
  ],
};
