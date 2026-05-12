"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useLiff } from "../../providers/LiffProvider";

type Draft = {
  id: string;
  name: string;
  kcal: number;
  protein_g: number | null;
  carb_g: number | null;
  fat_g: number | null;
  image_url: string | null;
  local_date: string;
};

export default function DraftEditPage() {
  const { apiFetch } = useLiff();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const draftId = params.id;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState(0);
  const [proteinG, setProteinG] = useState(0);
  const [carbG, setCarbG] = useState(0);
  const [fatG, setFatG] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/meal-drafts/${draftId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `error_${res.status}`);
      const d = json.draft as Draft;
      setDraft(d);
      setName(d.name);
      setKcal(d.kcal);
      setProteinG(d.protein_g ?? 0);
      setCarbG(d.carb_g ?? 0);
      setFatG(d.fat_g ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, draftId]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirm() {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/meal-drafts/${draftId}`, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim() || draft.name,
          kcal,
          protein_g: proteinG,
          carb_g: carbG,
          fat_g: fatG,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `error_${res.status}`);
      toast.success(`บันทึกแล้ว · +${kcal.toLocaleString()} kcal`);
      router.replace("/meals");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังโหลด…
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error ?? "ไม่พบรายการ"}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.replace("/meals")}>
          กลับหน้าหลัก
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 pb-24">
      <header className="space-y-1 pt-2">
        <p className="text-xs text-muted-foreground">แก้ไขก่อนบันทึก</p>
        <h1 className="text-2xl font-semibold">ตรวจสอบอาหาร</h1>
      </header>

      {draft.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={draft.image_url}
          alt="meal"
          className="aspect-video w-full rounded-2xl object-cover shadow-sm"
        />
      )}

      <Card className="rounded-2xl border-none shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs text-muted-foreground">
              ชื่ออาหาร
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kcal" className="text-xs text-muted-foreground">
              พลังงาน (kcal)
            </Label>
            <Input
              id="kcal"
              type="number"
              inputMode="numeric"
              min={0}
              value={kcal}
              onChange={(e) => setKcal(Math.max(0, Number(e.target.value) || 0))}
              className="rounded-xl text-base"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardContent className="space-y-4 p-5">
          <p className="text-xs font-medium text-muted-foreground">สารอาหารหลัก</p>
          <div className="grid grid-cols-3 gap-3">
            <MacroField
              id="protein"
              label="โปรตีน (g)"
              value={proteinG}
              onChange={setProteinG}
            />
            <MacroField
              id="carb"
              label="คาร์บ (g)"
              value={carbG}
              onChange={setCarbG}
            />
            <MacroField
              id="fat"
              label="ไขมัน (g)"
              value={fatG}
              onChange={setFatG}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      <div
        className="fixed inset-x-0 z-30 mx-auto w-full max-w-md px-5 bottom-safe-nav"
        style={{ paddingTop: "0.5rem" }}
      >
        <Button
          size="lg"
          className="h-14 w-full rounded-2xl text-base font-semibold shadow-xl"
          onClick={confirm}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Save /> บันทึก
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function MacroField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[11px] text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="rounded-xl px-2 text-sm"
      />
    </div>
  );
}
