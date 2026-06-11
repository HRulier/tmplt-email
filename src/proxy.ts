import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes accessibles sans session
const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/reset-password",
  "/api/auth",
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Better Auth pose ce cookie à la connexion.
  // On ne fait que vérifier sa présence ici — la vraie validation
  // (signature JWT) se fait dans les Route Handlers via auth.api.getSession().
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
