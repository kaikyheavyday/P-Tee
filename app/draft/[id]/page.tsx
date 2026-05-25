"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  AlertCircle,
  Sparkles,
  Lock,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

type AiEstimate = {
  name: string;
  total_kcal: number;
  confidence: number;
  macros: { protein_g: number; carb_g: number; fat_g: number };
};

export default function DraftEditPage() {
  const { apiFetch, liff, isInClient } = useLiff();
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

  // AI examine state
  const [examining, setExamining] = useState(false);
  const [aiEstimate, setAiEstimate] = useState<AiEstimate | null>(null);
  const [examineError, setExamineError] = useState<string | null>(null);

  // Nutrition/calorie lock — locked by default, user can unlock to adjust manually
  const [adjustMode, setAdjustMode] = useState(false);

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

  async function runExamine() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("กรอกชื่ออาหารก่อน");
      return;
    }
    setExamineError(null);
    setAiEstimate(null);
    setExamining(true);
    try {
      const res = await apiFetch("/api/estimate", {
        method: "POST",
        body: JSON.stringify({ text: trimmed, portion: "1 จาน" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `error_${res.status}`);
      const est = json.estimate as AiEstimate;
      setAiEstimate(est);
      // Apply AI values to the fields (keep locked unless user enables adjust mode)
      setKcal(est.total_kcal);
      setProteinG(est.macros.protein_g);
      setCarbG(est.macros.carb_g);
      setFatG(est.macros.fat_g);
      setAdjustMode(false);
    } catch (e) {
      setExamineError(e instanceof Error ? e.message : "ตรวจสอบไม่สำเร็จ");
    } finally {
      setExamining(false);
    }
  }

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
      // Close LIFF window if inside LINE client, otherwise navigate to meals
      if (isInClient && liff) {
        liff.closeWindow();
      } else {
        router.replace("/meals");
      }
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

      {/* Meal name + Examine button */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs text-muted-foreground">
              ชื่ออาหาร
            </Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl text-base"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 rounded-xl px-3"
                onClick={runExamine}
                disabled={examining}
              >
                {examining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span className="ml-1 text-xs">ตรวจสอบ</span>
              </Button>
            </div>
          </div>

          {/* Examining loading */}
          {examining && (
            <div className="space-y-2 rounded-xl bg-brand-50 p-4">
              <div className="flex items-center gap-2 text-brand-600">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">AI กำลังตรวจสอบ…</span>
              </div>
              <TypingIndicator />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          )}

          {/* AI estimate result */}
          {!examining && aiEstimate && (
            <div
              className="relative overflow-hidden rounded-2xl p-4 text-white shadow"
              style={{
                background:
                  "linear-gradient(135deg, #FFB85C 0%, #FF8A0D 60%, #FF6B00 100%)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-white/80">
                    AI ประเมินว่า
                  </p>
                  <p className="mt-0.5 truncate font-semibold">
                    {aiEstimate.name}
                  </p>
                </div>
                <Badge className="shrink-0 bg-white/25 text-white hover:bg-white/30">
                  <Sparkles className="mr-1 h-3 w-3" />
                  {Math.round(aiEstimate.confidence * 100)}%
                </Badge>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {aiEstimate.total_kcal.toLocaleString()}{" "}
                <span className="text-sm font-normal text-white/80">kcal</span>
              </p>
              <div className="mt-2 flex gap-3 text-xs text-white/90">
                <span>🥩 {Math.round(aiEstimate.macros.protein_g)}g</span>
                <span>🍚 {Math.round(aiEstimate.macros.carb_g)}g</span>
                <span>🧈 {Math.round(aiEstimate.macros.fat_g)}g</span>
              </div>
              <p className="mt-1 text-[10px] text-white/60">
                * ค่าอัปเดตในฟอร์มด้านล่างแล้ว
              </p>
            </div>
          )}

          {/* Examine error */}
          {examineError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{examineError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Calories & macros — locked by default, unlockable */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              พลังงานและสารอาหาร
            </p>
            <button
              type="button"
              onClick={() => setAdjustMode((v) => !v)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                adjustMode
                  ? "bg-brand-100 text-brand-700"
                  : "bg-muted text-muted-foreground hover:bg-accent",
              )}
            >
              {adjustMode ? (
                <>
                  <Pencil className="h-3 w-3" /> แก้ไขอยู่
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" /> ปรับแต่ง
                </>
              )}
            </button>
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
              disabled={!adjustMode}
              className={cn(
                "rounded-xl text-base",
                !adjustMode && "cursor-not-allowed opacity-60",
              )}
            />
          </div>

          <div>
            <p className="mb-2 text-xs text-muted-foreground">สารอาหารหลัก</p>
            <div className="grid grid-cols-3 gap-3">
              <MacroField
                id="protein"
                label="โปรตีน (g)"
                value={proteinG}
                onChange={setProteinG}
                disabled={!adjustMode}
              />
              <MacroField
                id="carb"
                label="คาร์บ (g)"
                value={carbG}
                onChange={setCarbG}
                disabled={!adjustMode}
              />
              <MacroField
                id="fat"
                label="ไขมัน (g)"
                value={fatG}
                onChange={setFatG}
                disabled={!adjustMode}
              />
            </div>
          </div>

          {!adjustMode && (
            <p className="text-center text-[10px] text-muted-foreground">
              กด "ปรับแต่ง" เพื่อแก้ไขค่าด้วยตัวเอง
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      <div
        className="fixed inset-x-0 z-30 mx-auto w-full max-w-md px-5 bottom-safe-nav"
        style={{ paddingTop: "0.5rem" }}
      >
        <div className="flex gap-2 rounded-2xl bg-background/95 p-2 shadow-xl ring-1 ring-border backdrop-blur">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 rounded-xl"
            onClick={() => router.replace("/meals")}
            disabled={saving}
          >
            <RotateCcw className="h-4 w-4" /> ยกเลิก
          </Button>
          <Button
            size="lg"
            className="flex-1 rounded-xl"
            onClick={confirm}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" /> บันทึก
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MacroField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
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
        disabled={disabled}
        className={cn(
          "rounded-xl px-2 text-sm",
          disabled && "cursor-not-allowed opacity-60",
        )}
      />
    </div>
  );
}

