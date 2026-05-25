import crypto from "node:crypto";
import { after, NextRequest, NextResponse } from "next/server";
import { estimateFromImage, estimateFromText } from "@/lib/llm";
import { localDate } from "@/lib/nutrition";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchLineMessageContent, replyToUser, showLoadingAnimation, verifyLineSignature } from "@/lib/line-messaging";
import {
  buildTodaySummaryFlex,
  buildEmptySummaryFlex,
  buildMealLoggedFlex,
  type MealRecord,
} from "@/lib/flex-summary";

// LINE Messaging API webhook event shapes (minimal subset we need)
type LineTextMessageEvent = {
  type: "message";
  replyToken: string;
  source: { userId: string };
  message: { type: "text"; text: string };
};

type LineImageMessageEvent = {
  type: "message";
  replyToken: string;
  source: { userId: string };
  message: { type: "image"; id: string };
};

type LinePostbackEvent = {
  type: "postback";
  replyToken: string;
  source: { userId: string };
  postback: { data: string };
};

type LineEvent = LineTextMessageEvent | LineImageMessageEvent | LinePostbackEvent | { type: string };

type LineWebhookBody = {
  events: LineEvent[];
};


function buildConfirmFlex(
  draftId: string,
  estimate: {
    name: string;
    total_kcal: number;
    macros: { protein_g: number; carb_g: number; fat_g: number };
  }
) {
  return {
    type: "flex" as const,
    altText: `ตรวจสอบ: ${estimate.name} ${estimate.total_kcal} kcal — กด "บันทึกเลย" เพื่อยืนยัน`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#FFF4E8",
        paddingAll: "14px",
        contents: [
          {
            type: "text",
            text: "ตรวจสอบก่อนบันทึก",
            weight: "bold",
            color: "#E37200",
            size: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: estimate.name,
            weight: "bold",
            size: "xl",
            color: "#1F2937",
            wrap: true,
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#FFF6EC",
            cornerRadius: "12px",
            paddingAll: "14px",
            spacing: "xs",
            contents: [
              { type: "text", text: "พลังงาน", size: "sm", color: "#A85400" },
              {
                type: "text",
                text: `${estimate.total_kcal} kcal`,
                weight: "bold",
                size: "4xl",
                color: "#E37200",
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#F8FAFC",
            cornerRadius: "12px",
            paddingAll: "12px",
            spacing: "sm",
            contents: [
              { type: "text", text: "สารอาหารหลัก", size: "sm", weight: "bold", color: "#475569" },
              {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#FFF6EC",
                    cornerRadius: "10px",
                    paddingAll: "10px",
                    alignItems: "center",
                    contents: [
                      { type: "text", text: "โปรตีน", size: "xs", color: "#A85400" },
                      { type: "text", text: `${estimate.macros.protein_g}g`, weight: "bold", size: "md", color: "#7A3D00" },
                    ],
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#FFF6EC",
                    cornerRadius: "10px",
                    paddingAll: "10px",
                    alignItems: "center",
                    contents: [
                      { type: "text", text: "คาร์บ", size: "xs", color: "#A85400" },
                      { type: "text", text: `${estimate.macros.carb_g}g`, weight: "bold", size: "md", color: "#7A3D00" },
                    ],
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#FFF6EC",
                    cornerRadius: "10px",
                    paddingAll: "10px",
                    alignItems: "center",
                    contents: [
                      { type: "text", text: "ไขมัน", size: "xs", color: "#A85400" },
                      { type: "text", text: `${estimate.macros.fat_g}g`, weight: "bold", size: "md", color: "#7A3D00" },
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
            color: "#FFA840",
            action: {
              type: "postback",
              label: "บันทึกเลย",
              data: `confirm:${draftId}`,
              displayText: "บันทึกอาหาร",
            },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "แก้ไข",
              uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/draft/${draftId}`,
            },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "postback",
              label: "ยกเลิก",
              data: `cancel:${draftId}`,
              displayText: "ยกเลิก",
            },
          },
        ],
      },
      styles: {
        header: { backgroundColor: "#FFF4E8" },
        body: { backgroundColor: "#FFFFFF" },
        footer: { backgroundColor: "#FFFFFF", separator: true },
      },
    },
  };
}

function buildOnboardingFlex() {
  return {
    type: "flex" as const,
    altText: "เริ่มใช้งาน P-Tee ก่อนบันทึกอาหาร",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#FFF4E8",
        paddingAll: "14px",
        contents: [
          {
            type: "text",
            text: "เริ่มใช้งาน P-Tee",
            weight: "bold",
            color: "#E37200",
            size: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "ตั้งค่าบัญชีก่อนนะคะ",
            weight: "bold",
            size: "xl",
            color: "#1F2937",
            wrap: true,
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#FFF6EC",
            cornerRadius: "12px",
            paddingAll: "14px",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "กรอกข้อมูลพื้นฐานในแอปเพื่อคำนวณเป้าหมายแคลอรี่ แล้วกลับมาส่งชื่ออาหารหรือรูปภาพได้เลย",
                size: "sm",
                color: "#7A3D00",
                wrap: true,
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
            color: "#FFA840",
            action: {
              type: "uri",
              label: "เริ่มตั้งค่า",
              uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/onboarding`,
            },
          },
        ],
      },
      styles: {
        header: { backgroundColor: "#FFF4E8" },
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

  // 4. Process each event (fire-and-forget per event; always return 200)
  const tasks = body.events.map(async (event) => {
    // ── Postback: confirm or cancel a pending meal draft ──────────────────────
    if (event.type === "postback") {
      const pb = event as LinePostbackEvent;
      const lineUserId = pb.source.userId;

      // Show typing animation while processing the postback
      await showLoadingAnimation(lineUserId, 15);

      const db = supabaseAdmin();
      const colonIdx = pb.postback.data.indexOf(":");
      const action = colonIdx >= 0 ? pb.postback.data.slice(0, colonIdx) : pb.postback.data;
      const draftId = colonIdx >= 0 ? pb.postback.data.slice(colonIdx + 1) : "";

      if (action === "confirm" && draftId) {
        const { data: draft } = await db
          .from("meal_drafts")
          .select("*")
          .eq("id", draftId)
          .eq("line_user_id", lineUserId)
          .single();

        if (!draft) {
          await replyToUser(pb.replyToken, [
            { type: "text", text: "ไม่พบรายการอาหาร อาจหมดเวลาแล้ว กรุณาส่งอาหารใหม่อีกครั้งนะคะ" },
          ]);
          return;
        }

        await db.from("meals").insert({
          line_user_id: draft.line_user_id,
          eaten_at: new Date().toISOString(),
          local_date: draft.local_date,
          input_text: draft.input_text,
          image_url: draft.image_url,
          name: draft.name,
          kcal: draft.kcal,
          protein_g: draft.protein_g,
          carb_g: draft.carb_g,
          fat_g: draft.fat_g,
          ai_raw: draft.ai_raw,
          ai_confidence: draft.ai_confidence,
          edited_by_user: false,
        });
        await db.from("meal_drafts").delete().eq("id", draftId);

        await replyToUser(pb.replyToken, [
          buildMealLoggedFlex({
            name: draft.name,
            total_kcal: draft.kcal,
            macros: { protein_g: draft.protein_g, carb_g: draft.carb_g, fat_g: draft.fat_g },
          }),
        ]);
        return;
      }

      if (action === "cancel" && draftId) {
        await db.from("meal_drafts").delete().eq("id", draftId).eq("line_user_id", lineUserId);
        await replyToUser(pb.replyToken, [
          { type: "text", text: "ยกเลิกแล้ว ส่งชื่ออาหารหรือรูปภาพมาใหม่ได้เลยนะคะ" },
        ]);
        return;
      }

      return;
    }

    // ── Message events ─────────────────────────────────────────────────────────
    if (event.type !== "message") return;
    const e = event as LineTextMessageEvent | LineImageMessageEvent;

    const lineUserId = e.source.userId;

    // Show typing animation immediately while we process
    await showLoadingAnimation(lineUserId, 30);

    // Look up user — guide new users to onboarding
    const db = supabaseAdmin();
    const { data: user } = await db
      .from("users")
      .select("timezone, daily_kcal_target")
      .eq("line_user_id", lineUserId)
      .single();
    if (!user) {
      await replyToUser(e.replyToken, [buildOnboardingFlex()]);
      return;
    }

    const tz = user.timezone ?? "Asia/Bangkok";
    const date = localDate(tz);

    // ── Image message ────────────────────────────────────────────────────────
    if (e.message.type === "image") {
      const imgEvent = e as LineImageMessageEvent;
      let estimate;
      let imageUrl: string | null = null;
      try {
        const dataUrl = await fetchLineMessageContent(imgEvent.message.id);

        // Upload to Supabase Storage (best-effort; confirm card is still sent if upload fails)
        const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (match) {
          const [, mimeType, b64] = match;
          const ext = mimeType.split("/")[1] ?? "jpeg";
          const storagePath = `${lineUserId}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadErr } = await db.storage
            .from("meal-photos")
            .upload(storagePath, Buffer.from(b64, "base64"), {
              contentType: mimeType,
              upsert: false,
            });
          if (!uploadErr) {
            const { data: publicData } = db.storage
              .from("meal-photos")
              .getPublicUrl(storagePath);
            imageUrl = publicData.publicUrl;
          }
        }

        estimate = await estimateFromImage(dataUrl);
      } catch (err) {
        console.error("[webhook] image estimate error:", err);
        await replyToUser(imgEvent.replyToken, [
          { type: "text", text: "ขอโทษนะคะ ไม่สามารถวิเคราะห์รูปภาพได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" },
        ]);
        return;
      }

      if (!estimate.is_food) {
        await replyToUser(imgEvent.replyToken, [
          { type: "text", text: "ไม่พบอาหารในรูปนี้\n\nกรุณาส่งรูปอาหารที่ต้องการบันทึกนะคะ" },
        ]);
        return;
      }

      // Save as draft and ask for confirmation
      const { data: imgDraft } = await db
        .from("meal_drafts")
        .insert({
          line_user_id: lineUserId,
          local_date: date,
          input_text: "[ภาพ]",
          image_url: imageUrl,
          name: estimate.name,
          kcal: estimate.total_kcal,
          protein_g: estimate.macros.protein_g,
          carb_g: estimate.macros.carb_g,
          fat_g: estimate.macros.fat_g,
          ai_raw: estimate,
          ai_confidence: estimate.confidence,
        })
        .select("id")
        .single();

      if (!imgDraft) return;

      await replyToUser(imgEvent.replyToken, [buildConfirmFlex(imgDraft.id, estimate)]);
      return;
    }

    // ── Text message ─────────────────────────────────────────────────────────
    if (e.message.type !== "text") return;
    const textEvent = e as LineTextMessageEvent;
    const text = textEvent.message.text.trim();
    if (!text) return;

    // Handle "สรุปวันนี้" command (no confirmation needed)
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

      await replyToUser(textEvent.replyToken, [flex]);
      return;
    }

    // Estimate calories using LLM
    let estimate;
    try {
      estimate = await estimateFromText(text);
    } catch (err) {
      console.error("[webhook] text estimate error:", err);
      await replyToUser(textEvent.replyToken, [
        { type: "text", text: "ขอโทษนะคะ ไม่สามารถประมาณแคลอรี่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" },
      ]);
      return;
    }

    if (!estimate.is_food) {
      await replyToUser(textEvent.replyToken, [
        { type: "text", text: "ไม่พบข้อมูลอาหารในข้อความนี้\n\nลองพิมพ์ชื่ออาหารที่ต้องการบันทึก หรือส่งรูปอาหารมาได้เลยนะคะ" },
      ]);
      return;
    }

    // Save as draft and ask for confirmation
    const { data: txtDraft } = await db
      .from("meal_drafts")
      .insert({
        line_user_id: lineUserId,
        local_date: date,
        input_text: text,
        name: estimate.name,
        kcal: estimate.total_kcal,
        protein_g: estimate.macros.protein_g,
        carb_g: estimate.macros.carb_g,
        fat_g: estimate.macros.fat_g,
        ai_raw: estimate,
        ai_confidence: estimate.confidence,
      })
      .select("id")
      .single();

    if (!txtDraft) return;

    await replyToUser(textEvent.replyToken, [buildConfirmFlex(txtDraft.id, estimate)]);
  });

  // 4. Process events in background — return 200 immediately so LINE never retries
  after(async () => {
    await Promise.allSettled(tasks);
  });

  return NextResponse.json({ ok: true });
}
