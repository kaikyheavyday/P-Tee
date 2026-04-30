import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
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
