import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const SUPER_ADMIN_ONLY_PREFIXES = ["/teachers", "/circles"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isLoginPage = pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (isLoggedIn && req.auth?.user.role !== "SUPER_ADMIN") {
    const isRestricted = SUPER_ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (isRestricted) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|manifest\\.json|.*\\.(?:ico|svg|png|jpg|jpeg|webp)$).*)"],
};
