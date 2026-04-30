/**
 * Daily push at ~8 PM Bangkok time. Schedule via Vercel Cron in vercel.json:
 *
 *   { "crons": [{ "path": "/api/push/daily", "schedule": "0 13 * * *" }] }
 *
 * (13:00 UTC == 20:00 Asia/Bangkok)
 *
 * Vercel sends Authorization: Bearer <CRON_SECRET>; we use PUSH_CRON_SECRET.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { localDate } from "@/lib/nutrition";
import { pushToUser } from "@/lib/line-messaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const secret = process.env.PUSH_CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { data: users, error } = await sb
    .from("users")
    .select("line_user_id, timezone, daily_kcal_target, display_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!users?.length) return NextResponse.json({ ok: true, sent: 0 });

  let sent = 0;
  let failed = 0;
  for (const u of users) {
    const tz = u.timezone || "Asia/Bangkok";
    const today = localDate(tz);
    const { data: meals } = await sb
      .from("meals")
      .select("kcal")
      .eq("line_user_id", u.line_user_id)
      .eq("local_date", today);
    const total = (meals ?? []).reduce((s, m) => s + (m.kcal ?? 0), 0);
    const target = u.daily_kcal_target ?? 2000;
    const remaining = target - total;
    const text =
      remaining >= 0
        ? `วันนี้กินไป ${total.toLocaleString()} / ${target.toLocaleString()} kcal — เหลืออีก ${remaining.toLocaleString()} kcal`
        : `วันนี้กินไป ${total.toLocaleString()} / ${target.toLocaleString()} kcal — เกินมาตรฐาน ${Math.abs(
            remaining
          ).toLocaleString()} kcal`;

    try {
      const r = await pushToUser(u.line_user_id, [{ type: "text", text }]);
      if (r.ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}

// Allow GET for easier manual trigger from a browser (still secret-gated).
export const GET = POST;
