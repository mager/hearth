import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "hearth.session";

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const authed = await hasValidSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/workspace")) {
    if (authed) return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && authed) {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/workspace/:path*", "/login"] };
