import { NextRequest, NextResponse } from "next/server";
import { estimateFromText } from "@/lib/llm";
import { localDate } from "@/lib/nutrition";
import { supabaseAdmin } from "@/lib/supabase";
import { replyToUser, verifyLineSignature } from "@/lib/line-messaging";
import {
  buildTodaySummaryFlex,
  buildEmptySummaryFlex,
  type MealRecord,
} from "@/lib/flex-summary";

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

function buildMealLoggedFlex(estimate: {
  name: string;
  total_kcal: number;
  macros: { protein_g: number; carb_g: number; fat_g: number };
}) {
  return {
    type: "flex" as const,
    altText: `บันทึกแคลอรีสำเร็จ: ${estimate.name} ${estimate.total_kcal} kcal`,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "16px",
        contents: [
          {
            type: "box",
            layout: "baseline",
            backgroundColor: "#E9F9EE",
            cornerRadius: "12px",
            paddingAll: "10px",
            contents: [
              {
                type: "text",
                text: "✅ บันทึกแล้ว!",
                weight: "bold",
                color: "#1F8B4C",
                size: "sm",
                flex: 0,
              },
            ],
          },
          {
            type: "text",
            text: `🍚 ${estimate.name}`,
            weight: "bold",
            size: "xl",
            color: "#1F2937",
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#FFF4E8",
            cornerRadius: "16px",
            paddingAll: "14px",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "พลังงาน",
                size: "sm",
                color: "#9A3412",
              },
              {
                type: "text",
                text: `${estimate.total_kcal} kcal`,
                weight: "bold",
                size: "4xl",
                color: "#EA580C",
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#F8FAFC",
            cornerRadius: "16px",
            paddingAll: "12px",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "สารอาหารหลัก",
                size: "sm",
                weight: "bold",
                color: "#475569",
              },
              {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#EEF2FF",
                    cornerRadius: "12px",
                    paddingAll: "10px",
                    alignItems: "center",
                    contents: [
                      {
                        type: "text",
                        text: "🥩 โปรตีน",
                        size: "xs",
                        color: "#4F46E5",
                      },
                      {
                        type: "text",
                        text: `${estimate.macros.protein_g}g`,
                        weight: "bold",
                        size: "md",
                        color: "#312E81",
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#ECFEFF",
                    cornerRadius: "12px",
                    paddingAll: "10px",
                    alignItems: "center",
                    contents: [
                      {
                        type: "text",
                        text: "🍚 คาร์บ",
                        size: "xs",
                        color: "#0891B2",
                      },
                      {
                        type: "text",
                        text: `${estimate.macros.carb_g}g`,
                        weight: "bold",
                        size: "md",
                        color: "#0E7490",
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#FFF7ED",
                    cornerRadius: "12px",
                    paddingAll: "10px",
                    alignItems: "center",
                    contents: [
                      {
                        type: "text",
                        text: "🧈 ไขมัน",
                        size: "xs",
                        color: "#C2410C",
                      },
                      {
                        type: "text",
                        text: `${estimate.macros.fat_g}g`,
                        weight: "bold",
                        size: "md",
                        color: "#9A3412",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "14px",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            color: "#22C55E",
            action: {
              type: "uri",
              label: "เพิ่มอีก",
              uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/meals`,
            },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            color: "#E2E8F0",
            action: {
              type: "uri",
              label: "ดูสรุปวันนี้",
              uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/meals`,
            },
          },
        ],
      },
      styles: {
        body: { backgroundColor: "#FFFFFF" },
        footer: { backgroundColor: "#FFFFFF", separator: true },
      },
    },
  };
}

// LINE pings GET to verify the webhook URL is reachable
export function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  // 1. Read raw body as bytes for HMAC verification (avoids any string encoding ambiguity)
  const rawBodyBuf = Buffer.from(await req.arrayBuffer());

  // 2. Verify LINE signature
  const signature = req.headers.get("x-line-signature") ?? "";
  const secretSet = !!process.env.LINE_MESSAGING_CHANNEL_SECRET;
  const secretLen = (process.env.LINE_MESSAGING_CHANNEL_SECRET ?? "").length;
  let valid: boolean;
  try {
    valid = verifyLineSignature(rawBodyBuf, signature);
  } catch (err) {
    console.error("[webhook] verify threw:", err);
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  console.log("[webhook] sig check", {
    valid,
    secretSet,
    secretLen,
    sigLen: signature.length,
    bodyLen: rawBodyBuf.length,
    bodyPreview: rawBodyBuf.toString("utf8").slice(0, 200),
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 3. Parse body
  let body: LineWebhookBody;
  try {
    body = JSON.parse(rawBodyBuf.toString("utf8")) as LineWebhookBody;
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
      .select("timezone, daily_kcal_target")
      .eq("line_user_id", lineUserId)
      .single();
    if (!user) return;

    const tz = user.timezone ?? "Asia/Bangkok";
    const date = localDate(tz);

    // Handle "สรุปวันนี้" command
    if (text === "สรุปวันนี้") {
      const { data: meals } = await db
        .from("meals")
        .select("name, kcal, protein_g, carb_g, fat_g")
        .eq("line_user_id", lineUserId)
        .eq("local_date", date)
        .order("eaten_at", { ascending: true });

      const records = (meals ?? []) as MealRecord[];
      const flex =
        records.length === 0
          ? buildEmptySummaryFlex(date)
          : buildTodaySummaryFlex(records, date, user.daily_kcal_target);

      await replyToUser(e.replyToken, [flex]);
      return;
    }

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

    await replyToUser(e.replyToken, [buildMealLoggedFlex(estimate)]);
  });

  // Wait for all events to finish, swallowing individual failures to always return 200
  await Promise.allSettled(tasks);

  return NextResponse.json({ ok: true });
}
