import { NextResponse } from "next/server";

const VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";

export type LineIdTokenPayload = {
  iss: string;
  sub: string; // line_user_id
  aud: string;
  exp: number;
  iat: number;
  name?: string;
  picture?: string;
};

/**
 * Verify a LIFF ID token with LINE's verify endpoint.
 * Returns the decoded payload (with sub = line_user_id) or null on failure.
 */
export async function verifyLineIdToken(
  idToken: string
): Promise<LineIdTokenPayload | null> {
  // ── Dev mock bypass ────────────────────────────────────────────────────────
  if (
    process.env.NODE_ENV !== "production" &&
    idToken === "mock_dev_token"
  ) {
    return {
      iss: "https://access.line.me",
      sub: process.env.LIFF_MOCK_USER_ID ?? "Umock_dev_user",
      aud: process.env.LINE_LOGIN_CHANNEL_ID ?? "mock_channel",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      name: process.env.LIFF_MOCK_DISPLAY_NAME ?? "Dev User",
    };
  }
  // ──────────────────────────────────────────────────────────────────────────

  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  if (!channelId) throw new Error("LINE_LOGIN_CHANNEL_ID not set");

  const body = new URLSearchParams({
    id_token: idToken,
    client_id: channelId,
  });

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = (await res.json()) as LineIdTokenPayload & { error?: string };
  if (data.error || !data.sub) return null;
  return data;
}

/** Extract bearer token from request. */
export function getBearer(req: Request): string | null {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/**
 * Convenience guard for route handlers. Returns the verified payload, or a
 * NextResponse to short-circuit. Use:
 *
 *   const auth = await requireUser(req);
 *   if (auth instanceof NextResponse) return auth;
 *   const userId = auth.sub;
 */
export async function requireUser(
  req: Request
): Promise<LineIdTokenPayload | NextResponse> {
  const token = getBearer(req);
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 401 });
  }
  const payload = await verifyLineIdToken(token);
  if (!payload) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }
  return payload;
}
