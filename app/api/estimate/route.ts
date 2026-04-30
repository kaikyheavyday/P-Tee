import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { estimateFromText, hashKey } from "@/lib/openai";
import { rateLimit, cacheGet, cacheSet } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const text = (body?.text || "").toString().trim();
  const portion = body?.portion ? body.portion.toString().trim() : undefined;
  if (!text) return NextResponse.json({ error: "missing_text" }, { status: 400 });

  // Rate limit: 30 / 5 min per user
  const rl = rateLimit({ key: `est:${auth.sub}`, max: 30, windowMs: 5 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", retry_after_ms: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const cacheKey = `est:${hashKey([text.toLowerCase(), portion || ""])}`;
  const cached = cacheGet<unknown>(cacheKey);
  if (cached) return NextResponse.json({ estimate: cached, cached: true });

  try {
    const estimate = await estimateFromText(text, portion);
    cacheSet(cacheKey, estimate);
    return NextResponse.json({ estimate, cached: false });
  } catch (e) {
    return NextResponse.json(
      { error: "estimate_failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
