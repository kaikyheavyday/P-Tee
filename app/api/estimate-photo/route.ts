import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { estimateFromImage } from "@/lib/llm";
import { rateLimit } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accept up to ~6 MB base64 payload
export const maxDuration = 30;

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const dataUrl = (body?.image_data_url || "").toString();
  const hint = body?.hint ? body.hint.toString().trim() : undefined;

  if (!dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "missing_or_invalid_image" }, { status: 400 });
  }

  // Photo estimation is more expensive — tighter limit
  const rl = rateLimit({ key: `estimg:${auth.sub}`, max: 15, windowMs: 5 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", retry_after_ms: rl.retryAfterMs },
      { status: 429 }
    );
  }

  try {
    const estimate = await estimateFromImage(dataUrl, hint);
    return NextResponse.json({ estimate });
  } catch (e) {
    return NextResponse.json(
      { error: "estimate_failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
