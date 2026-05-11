/**
 * Push messages via the LINE Messaging API (separate channel from LINE Login).
 *   Console → Provider → Create Messaging API channel → copy access token.
 */

import crypto from "node:crypto";

const PUSH_URL = "https://api.line.me/v2/bot/message/push";
const REPLY_URL = "https://api.line.me/v2/bot/message/reply";
const CONTENT_URL = "https://api-data.line.me/v2/bot/message";
const LOADING_URL = "https://api.line.me/v2/bot/message/loadingAnimation";

export type LineMessage =
  | { type: "text"; text: string }
  | { type: "flex"; altText: string; contents: unknown };

export async function pushToUser(
  lineUserId: string,
  messages: LineMessage[]
): Promise<{ ok: boolean; status: number; body?: string }> {
  const token = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN not set");

  const res = await fetch(PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: lineUserId, messages }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, status: res.status, body };
  }
  return { ok: true, status: res.status };
}

/** Verify the X-Line-Signature header using HMAC-SHA256 of the raw body bytes. */
export function verifyLineSignature(rawBody: Buffer, signature: string): boolean {
  const secret = process.env.LINE_MESSAGING_CHANNEL_SECRET;
  if (!secret) throw new Error("LINE_MESSAGING_CHANNEL_SECRET not set");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");
  const sig = signature.trim();
  const expectedBuf = Buffer.from(expected);
  const sigBuf = Buffer.from(sig);
  if (expectedBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, sigBuf);
}

/**
 * Show a typing/loading animation in the LINE chat for up to `seconds` (5–60).
 * Fire-and-forget safe — errors are swallowed so they never block the main flow.
 */
export async function showLoadingAnimation(
  chatId: string,
  seconds: number = 30,
): Promise<void> {
  const token = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
  if (!token) return;
  await fetch(LOADING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ chatId, loadingSeconds: Math.min(Math.max(seconds, 5), 60) }),
  }).catch(() => {});
}

/**
 * Download the binary content of a LINE image message and return it as a
 * base64 data URL (e.g. "data:image/jpeg;base64,...").
 */
export async function fetchLineMessageContent(messageId: string): Promise<string> {
  const token = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN not set");

  const res = await fetch(`${CONTENT_URL}/${messageId}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LINE content fetch failed ${res.status}: ${text.slice(0, 200)}`);
  }
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

/** Reply to a LINE event using a reply token (one-shot, no extra charge). */
export async function replyToUser(
  replyToken: string,
  messages: LineMessage[]
): Promise<{ ok: boolean; status: number; body?: string }> {
  const token = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN not set");

  const res = await fetch(REPLY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, status: res.status, body };
  }
  return { ok: true, status: res.status };
}
