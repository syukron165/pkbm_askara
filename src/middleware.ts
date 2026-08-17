import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ROLE_CONFIGS, Role } from "./lib/rbac";

const AUTH_COOKIE_NAME = "askara_auth_token";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pkbm-askara-secure-jwt-secret-key-development-2026"
);

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/tamu",
  "/api/buku-tamu",
  "/pendaftaran",
  "/api/pendaftaran",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow Next.js internals, static files, and public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // file extensions like .ico, .png
  ) {
    return NextResponse.next();
  }

  // 2. Read Auth Token
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  let user: { role: Role; email: string; name: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      user = payload as unknown as { role: Role; email: string; name: string };
    } catch {
      user = null;
    }
  }

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));

  // 3. If accessing root landing page "/"
  if (pathname === "/") {
    // If already logged in, seamlessly forward to role dashboard
    if (user && ROLE_CONFIGS[user.role]) {
      return NextResponse.redirect(new URL(ROLE_CONFIGS[user.role].defaultRedirect, request.url));
    }
    return NextResponse.next();
  }

  // 4. If user is on /login and already authenticated
  if (pathname === "/login") {
    if (user && ROLE_CONFIGS[user.role]) {
      return NextResponse.redirect(new URL(ROLE_CONFIGS[user.role].defaultRedirect, request.url));
    }
    return NextResponse.next();
  }

  // 5. If user is NOT logged in and attempting to access protected route
  if (!user && !isPublicPath) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Check RBAC permissions for authenticated user
  if (user) {
    const roleConfig = ROLE_CONFIGS[user.role];
    if (!roleConfig) {
      // Invalid role
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }

    if (user.role !== "super_admin") {
      // Specifically restrict /admin/aset to super_admin only
      if (pathname.startsWith("/admin/aset")) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      const isAllowed =
        pathname.startsWith("/api") ||
        roleConfig.allowedPrefixes.some((prefix) => pathname.startsWith(prefix));
      if (!isAllowed && !isPublicPath) {
        // Redirect to authorized default role dashboard
        return NextResponse.redirect(new URL(roleConfig.defaultRedirect, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
