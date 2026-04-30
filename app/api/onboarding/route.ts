import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { computeTargets, type Activity, type Gender, type Goal } from "@/lib/nutrition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OnboardingBody = {
  display_name?: string;
  picture_url?: string;
  gender: Gender;
  birthdate: string; // YYYY-MM-DD
  height_cm: number;
  weight_kg: number;
  activity: Activity;
  goal: Goal;
  timezone?: string;
};

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => null)) as OnboardingBody | null;
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const required: (keyof OnboardingBody)[] = [
    "gender",
    "birthdate",
    "height_cm",
    "weight_kg",
    "activity",
    "goal",
  ];
  for (const k of required) {
    if (body[k] === undefined || body[k] === null || body[k] === "") {
      return NextResponse.json({ error: `missing_${k}` }, { status: 400 });
    }
  }

  let t;
  try {
    t = computeTargets({
      gender: body.gender,
      birthdate: body.birthdate,
      heightCm: body.height_cm,
      weightKg: body.weight_kg,
      activity: body.activity,
      goal: body.goal,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "calc_failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 400 }
    );
  }

  const row = {
    line_user_id: auth.sub,
    display_name: body.display_name ?? auth.name ?? null,
    picture_url: body.picture_url ?? auth.picture ?? null,
    gender: body.gender,
    birthdate: body.birthdate,
    height_cm: body.height_cm,
    weight_kg: body.weight_kg,
    activity: body.activity,
    goal: body.goal,
    daily_kcal_target: t.dailyTarget,
    timezone: body.timezone || "Asia/Bangkok",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin()
    .from("users")
    .upsert(row, { onConflict: "line_user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data, targets: t });
}
