import Cookies from "js-cookie";

// The access token is stored as a regular cookie (readable by JS)
// The refresh token is httpOnly (invisible to JS, sent by browser automatically)

const ACCESS_TOKEN_KEY = "nexos_at";

export function storeAccessToken(token: string) {
  // Short-lived cookie readable by client JS & middleware
  Cookies.set(ACCESS_TOKEN_KEY, token, {
    expires: 1, // 1 day — actual expiry is shorter but cookie refreshes often
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function getStoredAccessToken(): string | null {
  return Cookies.get(ACCESS_TOKEN_KEY) ?? null;
}

export function clearAccessToken() {
  Cookies.remove(ACCESS_TOKEN_KEY);
}

/** Decode JWT payload without verification (client-side only) */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Check if token is expired (with 30s buffer) */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return (payload.exp as number) * 1000 < Date.now() - 30000;
}
