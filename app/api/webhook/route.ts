import { NextRequest, NextResponse } from "next/server";
import { estimateFromText } from "@/lib/llm";
import { localDate } from "@/lib/nutrition";
import { supabaseAdmin } from "@/lib/supabase";
import { replyToUser, verifyLineSignature } from "@/lib/line-messaging";

// LINE Messaging API webhook event shapes (minimal subset we need)
type LineTextMessageEvent = {
  type: "message";
  replyToken: string;
  source: { userId: string };
  message: { type: "text"; text: string };
};

type LineEvent = LineTextMessageEvent | { type: string };

type LineWebhookBody = {
  events: LineEvent[];
};

// LINE pings GET to verify the webhook URL is reachable
export function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  // 1. Read raw body as text for HMAC verification
  const rawBody = await req.text();

  // 2. Verify LINE signature
  const signature = req.headers.get("x-line-signature") ?? "";
  let valid: boolean;
  try {
    valid = verifyLineSignature(rawBody, signature);
  } catch {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 3. Parse body
  let body: LineWebhookBody;
  try {
    body = JSON.parse(rawBody) as LineWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 4. Process each text message event (fire-and-forget per event; always return 200)
  const tasks = body.events.map(async (event) => {
    if (event.type !== "message") return;
    const e = event as LineTextMessageEvent;
    if (e.message.type !== "text") return;

    const lineUserId = e.source.userId;
    const text = e.message.text.trim();
    if (!text) return;

    // Look up user — silently skip if not registered
    const db = supabaseAdmin();
    const { data: user } = await db
      .from("users")
      .select("timezone")
      .eq("line_user_id", lineUserId)
      .single();
    if (!user) return;

    // Estimate calories using LLM
    let estimate;
    try {
      estimate = await estimateFromText(text);
    } catch {
      await replyToUser(e.replyToken, [
        { type: "text", text: "ขอโทษนะคะ ไม่สามารถประมาณแคลอรี่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง 🙏" },
      ]);
      return;
    }

    const tz = user.timezone ?? "Asia/Bangkok";
    const date = localDate(tz);

    // Save meal to Supabase
    await db.from("meals").insert({
      line_user_id: lineUserId,
      eaten_at: new Date().toISOString(),
      local_date: date,
      input_text: text,
      name: estimate.name,
      kcal: estimate.total_kcal,
      protein_g: estimate.macros.protein_g,
      carb_g: estimate.macros.carb_g,
      fat_g: estimate.macros.fat_g,
      ai_raw: estimate,
      ai_confidence: estimate.confidence,
      edited_by_user: false,
    });

    // Build reply
    const reply =
      `บันทึกแล้ว! 🍽\n` +
      `${estimate.name}\n\n` +
      `📊 ${estimate.total_kcal} kcal\n` +
      `🥩 โปรตีน ${estimate.macros.protein_g}g  🍚 คาร์บ ${estimate.macros.carb_g}g  🧈 ไขมัน ${estimate.macros.fat_g}g`;

    await replyToUser(e.replyToken, [{ type: "text", text: reply }]);
  });

  // Wait for all events to finish, swallowing individual failures to always return 200
  await Promise.allSettled(tasks);

  return NextResponse.json({ ok: true });
}
