import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { localDate } from "@/lib/nutrition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SaveBody = {
  name: string;
  kcal: number;
  input_text?: string;
  image_url?: string;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
  ai_raw?: unknown;
  ai_confidence?: number;
  edited_by_user?: boolean;
};

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const date = url.searchParams.get("date"); // YYYY-MM-DD
  const sb = supabaseAdmin();

  let q = sb
    .from("meals")
    .select("*")
    .eq("line_user_id", auth.sub)
    .order("eaten_at", { ascending: false });

  if (date) q = q.eq("local_date", date);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meals: data });
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => null)) as SaveBody | null;
  if (!body || !body.name || typeof body.kcal !== "number") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: user } = await sb
    .from("users")
    .select("timezone")
    .eq("line_user_id", auth.sub)
    .maybeSingle();
  const tz = user?.timezone || "Asia/Bangkok";

  const row = {
    line_user_id: auth.sub,
    name: body.name,
    kcal: Math.max(0, Math.round(body.kcal)),
    input_text: body.input_text ?? null,
    image_url: body.image_url ?? null,
    protein_g: body.protein_g ?? null,
    carb_g: body.carb_g ?? null,
    fat_g: body.fat_g ?? null,
    ai_raw: body.ai_raw ?? null,
    ai_confidence: body.ai_confidence ?? null,
    edited_by_user: !!body.edited_by_user,
    eaten_at: new Date().toISOString(),
    local_date: localDate(tz),
  };

  const { data, error } = await sb.from("meals").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meal: data });
}
