export const GUEST_ID_HEADER = "x-guest-id";
export const GUEST_ID_COOKIE = "guest_id";

export function parseGuestId(headers: Headers): string | null {
  const fromHeader = headers.get(GUEST_ID_HEADER)?.trim();
  if (fromHeader) return fromHeader;

  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === GUEST_ID_COOKIE) {
      const value = valueParts.join("=").trim();
      return value || null;
    }
  }

  return null;
}
