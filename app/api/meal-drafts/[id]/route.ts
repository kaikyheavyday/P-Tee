import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { localDate } from "@/lib/nutrition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/meal-drafts/[id] — fetch a pending draft */
export async function GET(req: Request, { params }: Params) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("meal_drafts")
    .select("*")
    .eq("id", id)
    .eq("line_user_id", auth.sub)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ draft: data });
}

type ConfirmBody = {
  name?: string;
  kcal?: number;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
};

/** POST /api/meal-drafts/[id]/confirm — confirm (with optional edits) and save to meals */
export async function POST(req: Request, { params }: Params) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as ConfirmBody;

  const db = supabaseAdmin();

  // Fetch draft and verify ownership
  const { data: draft, error: fetchErr } = await db
    .from("meal_drafts")
    .select("*")
    .eq("id", id)
    .eq("line_user_id", auth.sub)
    .single();

  if (fetchErr || !draft) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Get user timezone
  const { data: user } = await db
    .from("users")
    .select("timezone")
    .eq("line_user_id", auth.sub)
    .maybeSingle();
  const tz = user?.timezone ?? "Asia/Bangkok";

  const name = body.name?.trim() || draft.name;
  const kcal = typeof body.kcal === "number" ? Math.max(0, Math.round(body.kcal)) : draft.kcal;
  const protein_g = typeof body.protein_g === "number" ? body.protein_g : draft.protein_g;
  const carb_g = typeof body.carb_g === "number" ? body.carb_g : draft.carb_g;
  const fat_g = typeof body.fat_g === "number" ? body.fat_g : draft.fat_g;

  const edited =
    name !== draft.name ||
    kcal !== draft.kcal ||
    protein_g !== draft.protein_g ||
    carb_g !== draft.carb_g ||
    fat_g !== draft.fat_g;

  // Insert into meals
  const { data: meal, error: insertErr } = await db
    .from("meals")
    .insert({
      line_user_id: draft.line_user_id,
      eaten_at: new Date().toISOString(),
      local_date: draft.local_date ?? localDate(tz),
      input_text: draft.input_text,
      image_url: draft.image_url,
      name,
      kcal,
      protein_g,
      carb_g,
      fat_g,
      ai_raw: draft.ai_raw,
      ai_confidence: draft.ai_confidence,
      edited_by_user: edited,
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Delete draft
  await db.from("meal_drafts").delete().eq("id", id);

  return NextResponse.json({ meal });
}
