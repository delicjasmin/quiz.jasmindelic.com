import { GUEST_ID_COOKIE, GUEST_ID_HEADER } from "@/lib/guest-id";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const existingGuestId = request.cookies.get(GUEST_ID_COOKIE)?.value;
  const guestId = existingGuestId ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(GUEST_ID_HEADER, guestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!existingGuestId) {
    response.cookies.set(GUEST_ID_COOKIE, guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
