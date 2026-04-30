/**
 * Push messages via the LINE Messaging API (separate channel from LINE Login).
 *   Console → Provider → Create Messaging API channel → copy access token.
 */

const PUSH_URL = "https://api.line.me/v2/bot/message/push";

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
