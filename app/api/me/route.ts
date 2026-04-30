import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabaseAdmin()
    .from("users")
    .select("*")
    .eq("line_user_id", auth.sub)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_onboarded" }, { status: 404 });
  return NextResponse.json({ user: data });
}

export async function PATCH(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const { computeTargets } = await import("@/lib/nutrition");

  // Load current user first to merge
  const sb = supabaseAdmin();
  const { data: current } = await sb
    .from("users")
    .select("*")
    .eq("line_user_id", auth.sub)
    .maybeSingle();
  if (!current) return NextResponse.json({ error: "not_onboarded" }, { status: 404 });

  const merged = { ...current, ...body };
  const t = computeTargets({
    gender: merged.gender,
    birthdate: merged.birthdate,
    heightCm: merged.height_cm,
    weightKg: merged.weight_kg,
    activity: merged.activity,
    goal: merged.goal,
  });

  const update = {
    ...body,
    daily_kcal_target: t.dailyTarget,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("users")
    .update(update)
    .eq("line_user_id", auth.sub)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data, targets: t });
}

export async function DELETE(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const sb = supabaseAdmin();
  const { error } = await sb.from("users").delete().eq("line_user_id", auth.sub);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
