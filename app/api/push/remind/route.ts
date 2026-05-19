/**
 * Meal-time reminder push — called 3× per day by Vercel Cron:
 *
 *   { "path": "/api/push/remind", "schedule": "0 1 * * *"  }  → 08:00 Bangkok (morning)
 *   { "path": "/api/push/remind", "schedule": "0 5 * * *"  }  → 12:00 Bangkok (noon)
 *   { "path": "/api/push/remind", "schedule": "30 11 * * *" }  → 18:30 Bangkok (evening)
 *
 * Bangkok is UTC+7. The route detects the current Bangkok hour and picks the
 * appropriate message pool automatically.
 *
 * Vercel sends Authorization: Bearer <CRON_SECRET>; we use PUSH_CRON_SECRET.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { pushToUser } from "@/lib/line-messaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MESSAGES = {
  morning: [
    "กินข้าวเช้าอะยางง 🍳",
    "ตื่นแล้วอย่าลืมกินข้าวเช้านะคับ 😋",
    "เช้าแล้ว กินข้าวหรือยังคับ 🌅",
    "กินข้าวเช้าด้วยนะ อย่าอดอาหารเช้า!",
    "เช้าแล้วค้าบ อย่าลืมกินข้าวด้วยล่ะ 🥚",
  ],
  noon: [
    "กินข้าวเที่ยงหรือยังคับ 🍱",
    "ถึงเวลาข้าวกลางวันแล้วนะ 🍚",
    "กินข้าวเที่ยงอะยางง",
    "อย่าลืมกินข้าวกลางวันนะคับ หิวแล้วมั้ย? 😄",
    "พักกินข้าวแล้วนะ อย่าอดข้าวกลางวัน! 🍜",
  ],
  evening: [
    "กินข้าวเย็นหรือยังคับ 🌆",
    "ถึงเวลาข้าวเย็นแล้วนะ 🍜",
    "กินข้าวเย็นอะยางง",
    "อย่าลืมกินข้าวเย็นด้วยนะคับ 🍽️",
    "เย็นแล้ว กินข้าวด้วยนะ หิวมั้ยเอ่ย? 😋",
  ],
} as const;

type Slot = keyof typeof MESSAGES;

function getBangkokHour(): number {
  const now = new Date();
  // Asia/Bangkok is UTC+7 with no DST
  const bangkokOffset = 7 * 60; // minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const bangkokMinutes = (utcMinutes + bangkokOffset) % (24 * 60);
  return Math.floor(bangkokMinutes / 60);
}

function detectSlot(hour: number): Slot | null {
  if (hour >= 7 && hour < 10) return "morning";
  if (hour >= 12 && hour < 13) return "noon";
  if (hour >= 18 && hour < 19) return "evening";
  return null;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: Request) {
  const secret = process.env.PUSH_CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const hour = getBangkokHour();
  const slot = detectSlot(hour);

  if (!slot) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: `bangkok hour ${hour} is outside any meal-time window`,
    });
  }

  const pool = MESSAGES[slot];

  const sb = supabaseAdmin();
  const { data: users, error } = await sb
    .from("users")
    .select("line_user_id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!users?.length) return NextResponse.json({ ok: true, sent: 0, slot });

  let sent = 0;
  let failed = 0;
  for (const u of users) {
    const text = pickRandom(pool);
    try {
      const r = await pushToUser(u.line_user_id, [{ type: "text", text }]);
      if (r.ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, slot, sent, failed });
}

// Allow GET for easier manual trigger from a browser (still secret-gated).
export const GET = POST;
