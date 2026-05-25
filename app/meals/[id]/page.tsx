"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save, Trash2, Sparkles, Droplets, Dumbbell, Wheat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useLiff } from "../../providers/LiffProvider";

type Meal = {
  id: string;
  name: string;
  kcal: number;
  protein_g: number | null;
  carb_g: number | null;
  fat_g: number | null;
  eaten_at: string;
  local_date: string;
  input_text: string | null;
  ai_confidence: number | null;
  edited_by_user: boolean;
};

export default function MealDetailPage() {
  const { apiFetch, idToken } = useLiff();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState(0);
  const [protein, setProtein] = useState("");
  const [carb, setCarb] = useState("");
  const [fat, setFat] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/meals/${id}`);
      if (res.status === 404) {
        setError("ไม่พบรายการนี้");
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `error_${res.status}`);
      const m = json.meal as Meal;
      setMeal(m);
      setName(m.name);
      setKcal(m.kcal);
      setProtein(m.protein_g?.toString() ?? "");
      setCarb(m.carb_g?.toString() ?? "");
      setFat(m.fat_g?.toString() ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, id]);

  useEffect(() => {
    if (id && idToken) load();
  }, [id, idToken, load]);

  async function save() {
    if (!name.trim()) {
      toast.error("ใส่ชื่ออาหาร");
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch(`/api/meals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          kcal,
          protein_g: protein === "" ? null : Number(protein),
          carb_g: carb === "" ? null : Number(carb),
          fat_g: fat === "" ? null : Number(fat),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `error_${res.status}`);
      }
      toast.success("บันทึกแล้ว");
      router.replace("/meals");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("ลบรายการนี้?")) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/meals/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `error_${res.status}`);
      }
      toast.success("ลบแล้ว");
      router.replace("/meals");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pb-28">
      <header className="flex items-center gap-2 pt-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="ย้อนกลับ"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-semibold">รายละเอียดอาหาร</h1>
      </header>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : meal ? (
        <>
          {/* Hero kcal */}
          <section
            className="relative overflow-hidden rounded-2xl border border-brand-100 bg-card p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              แคลอรี่
            </p>
            <p className="mt-1 text-4xl font-semibold leading-none text-brand-600">
              {kcal.toLocaleString()}
              <span className="ml-1 text-base font-normal text-muted-foreground">kcal</span>
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {new Date(meal.eaten_at).toLocaleString("th-TH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            {(meal.edited_by_user || meal.ai_confidence != null) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {meal.edited_by_user && (
                  <Badge className="bg-brand-50 text-brand-600 hover:bg-brand-100">
                    แก้ไขแล้ว
                  </Badge>
                )}
                {meal.ai_confidence != null && (
                  <Badge className="bg-brand-50 text-brand-600 hover:bg-brand-100">
                    <Sparkles className="mr-1 h-3 w-3" />
                    ความมั่นใจ {Math.round(meal.ai_confidence * 100)}%
                  </Badge>
                )}
              </div>
            )}
          </section>

          {/* Name + kcal */}
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs text-muted-foreground">
                  ชื่ออาหาร
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kcal" className="text-xs text-muted-foreground">
                  แคลอรี่
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="kcal"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={kcal}
                    onChange={(e) =>
                      setKcal(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="h-14 rounded-xl text-2xl font-semibold"
                  />
                  <span className="text-muted-foreground">kcal</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Macros */}
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="space-y-3 p-5">
              <p className="text-xs font-medium text-muted-foreground">
                สารอาหาร
              </p>
              <div className="grid grid-cols-3 gap-2">
                <MacroInput
                  label="โปรตีน"
                  value={protein}
                  onChange={setProtein}
                  icon={Dumbbell}
                />
                <MacroInput
                  label="คาร์บ"
                  value={carb}
                  onChange={setCarb}
                  icon={Wheat}
                />
                <MacroInput
                  label="ไขมัน"
                  value={fat}
                  onChange={setFat}
                  icon={Droplets}
                />
              </div>
            </CardContent>
          </Card>

          {meal.input_text && (
            <Card className="rounded-2xl border-none bg-muted/40">
              <CardContent className="space-y-1 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  ข้อความเดิม
                </p>
                <p className="text-sm italic text-foreground/80">
                  {meal.input_text}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Sticky action bar */}
          <div
            className="fixed inset-x-0 z-30 mx-auto w-full max-w-md px-5 bottom-safe-nav"
            style={{ paddingTop: "0.5rem" }}
          >
            <div className="flex gap-2 rounded-2xl bg-background/95 p-2 shadow-xl ring-1 ring-border backdrop-blur">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={remove}
                disabled={saving || deleting}
              >
                {deleting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Trash2 /> ลบ
                  </>
                )}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={save}
                disabled={saving || deleting}
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
        </>
      ) : null}
    </div>
  );
}

function MacroInput({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border bg-background p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="h-4 w-4" />
      </span>
      <span className="mt-1 inline-block text-[10px] font-medium text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-baseline gap-1">
        <Input
          type="number"
          inputMode="decimal"
          step="0.1"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 border-0 px-0 text-base font-semibold shadow-none focus-visible:ring-0"
          placeholder="0"
        />
        <span className="text-xs text-muted-foreground">g</span>
      </div>
    </div>
  );
}
