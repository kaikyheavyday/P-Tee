import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { localDate } from "@/lib/nutrition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "7d";
  const days = range === "30d" ? 30 : 7;

  const sb = supabaseAdmin();
  const { data: user } = await sb
    .from("users")
    .select("timezone, daily_kcal_target")
    .eq("line_user_id", auth.sub)
    .maybeSingle();
  const tz = user?.timezone || "Asia/Bangkok";
  const target = user?.daily_kcal_target ?? null;

  const today = localDate(tz);
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const fromDate = localDate(tz, from);

  const { data, error } = await sb
    .from("meals")
    .select("local_date, kcal")
    .eq("line_user_id", auth.sub)
    .gte("local_date", fromDate)
    .lte("local_date", today);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totals = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    totals.set(localDate(tz, d), 0);
  }
  for (const row of data ?? []) {
    totals.set(row.local_date, (totals.get(row.local_date) ?? 0) + (row.kcal ?? 0));
  }

  const series = Array.from(totals.entries())
    .map(([date, kcal]) => ({ date, kcal }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return NextResponse.json({ series, daily_target: target });
}
