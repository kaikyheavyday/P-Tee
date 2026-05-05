import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PatchBody = {
  name?: string;
  kcal?: number;
  protein_g?: number | null;
  carb_g?: number | null;
  fat_g?: number | null;
};

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("meals")
    .select("*")
    .eq("id", id)
    .eq("line_user_id", auth.sub)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ meal: data });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const patch: Record<string, unknown> = { edited_by_user: true };
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.kcal === "number") patch.kcal = Math.max(0, Math.round(body.kcal));
  if (body.protein_g !== undefined) patch.protein_g = body.protein_g;
  if (body.carb_g !== undefined) patch.carb_g = body.carb_g;
  if (body.fat_g !== undefined) patch.fat_g = body.fat_g;

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("meals")
    .update(patch)
    .eq("id", id)
    .eq("line_user_id", auth.sub)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meal: data });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const sb = supabaseAdmin();
  const { error } = await sb
    .from("meals")
    .delete()
    .eq("id", id)
    .eq("line_user_id", auth.sub);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
