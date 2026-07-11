import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/session";

export function proxy(request: NextRequest) {
  const session = verifySessionToken(request.cookies.get("sunspark_session")?.value ?? "");
  const { pathname } = request.nextUrl;

  if (session?.role === "ADMIN" && !pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (session?.role === "ADMIN" && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|uploads).*)"]
};
