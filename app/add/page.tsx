"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Loader2,
  Sparkles,
  Type,
  Upload,
  Save,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLiff } from "../providers/LiffProvider";

type CalorieEstimate = {
  name: string;
  items: Array<{ name: string; kcal: number; portion: string }>;
  total_kcal: number;
  confidence: number;
  macros: { protein_g: number; carb_g: number; fat_g: number };
};

type Stage = "input" | "estimating" | "preview";
type Mode = "text" | "photo";

const PORTIONS = [
  { value: "0.5 จาน", label: "ครึ่งจาน" },
  { value: "1 จาน", label: "1 จาน" },
  { value: "2 จาน", label: "2 จาน" },
];

export default function AddPage() {
  const { apiFetch } = useLiff();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("input");
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [portion, setPortion] = useState("1 จาน");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<CalorieEstimate | null>(null);
  const [editedKcal, setEditedKcal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStage("input");
    setEstimate(null);
    setError(null);
  }

  function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      toast.error("ไฟล์ใหญ่เกิน 6MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function runEstimate() {
    setError(null);
    if (mode === "text" && !text.trim()) {
      toast.error("กรอกชื่ออาหารก่อน");
      return;
    }
    if (mode === "photo" && !imageDataUrl) {
      toast.error("เลือกรูปก่อน");
      return;
    }
    setStage("estimating");
    try {
      const res =
        mode === "text"
          ? await apiFetch("/api/estimate", {
              method: "POST",
              body: JSON.stringify({ text: text.trim(), portion }),
            })
          : await apiFetch("/api/estimate-photo", {
              method: "POST",
              body: JSON.stringify({ image_data_url: imageDataUrl }),
            });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `error_${res.status}`);
      const est = json.estimate as CalorieEstimate;
      setEstimate(est);
      setEditedKcal(est.total_kcal);
      setStage("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ประเมินไม่สำเร็จ");
      setStage("input");
    }
  }

  async function saveMeal() {
    if (!estimate) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/meals", {
        method: "POST",
        body: JSON.stringify({
          name: estimate.name,
          kcal: editedKcal,
          input_text: mode === "text" ? text.trim() : undefined,
          protein_g: estimate.macros.protein_g,
          carb_g: estimate.macros.carb_g,
          fat_g: estimate.macros.fat_g,
          ai_raw: estimate,
          ai_confidence: estimate.confidence,
          edited_by_user: editedKcal !== estimate.total_kcal,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `error_${res.status}`);
      }
      toast.success(`บันทึกแล้ว · +${editedKcal.toLocaleString()} kcal`);
      router.replace("/meals");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 pb-24">
      <header className="space-y-1 pt-2">
        <p className="text-xs text-muted-foreground">บันทึกมื้ออาหาร</p>
        <h1 className="text-2xl font-semibold">เพิ่มอาหาร</h1>
      </header>

      {stage === "input" && (
        <>
          {/* Mode chooser */}
          <div className="grid grid-cols-2 gap-2">
            <ModeCard
              active={mode === "text"}
              icon={<Type className="h-5 w-5" />}
              label="พิมพ์ชื่อ"
              hint="พิมพ์ชื่ออาหาร"
              onClick={() => setMode("text")}
            />
            <ModeCard
              active={mode === "photo"}
              icon={<Camera className="h-5 w-5" />}
              label="ถ่ายรูป"
              hint="ถ่ายหรือเลือกรูป"
              onClick={() => setMode("photo")}
            />
          </div>

          {mode === "text" ? (
            <Card className="rounded-2xl border-none shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="space-y-2">
                  <Label htmlFor="food" className="text-xs text-muted-foreground">
                    ชื่ออาหาร
                  </Label>
                  <Textarea
                    id="food"
                    placeholder="เช่น กระเพราไก่ไข่ดาว, ก๋วยเตี๋ยวต้มยำหมูสับ"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[112px] rounded-xl text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">ปริมาณ</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {PORTIONS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPortion(p.value)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                          portion === p.value
                            ? "border-brand-400 bg-brand-50 text-brand-700"
                            : "border-input bg-background hover:bg-accent",
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-none shadow-sm">
              <CardContent className="space-y-3 p-5">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePickImage}
                />
                {imageDataUrl ? (
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageDataUrl}
                      alt="meal"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 text-brand-600 hover:bg-brand-50"
                  >
                    <Upload className="h-8 w-8" />
                    <span className="text-sm font-medium">แตะเพื่อถ่าย/เลือกรูป</span>
                  </button>
                )}
                {imageDataUrl && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload /> เปลี่ยนรูป
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sticky CTA */}
          <div
            className="fixed inset-x-0 z-30 mx-auto w-full max-w-md px-5 bottom-safe-nav"
            style={{ paddingTop: "0.5rem" }}
          >
            <Button
              size="lg"
              className="h-14 w-full rounded-2xl text-base font-semibold shadow-xl"
              onClick={runEstimate}
            >
              <Sparkles /> ประเมินแคล
            </Button>
          </div>
        </>
      )}

      {stage === "estimating" && (
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2 text-brand-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">กำลังประเมิน…</span>
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      )}

      {stage === "preview" && estimate && (
        <>
          <section
            className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, #FFB85C 0%, #FF8A0D 60%, #FF6B00 100%)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-white/80">
                  AI ประเมินว่า
                </p>
                <p className="mt-1 truncate text-xl font-semibold">
                  {estimate.name}
                </p>
              </div>
              <Badge className="bg-white/25 text-white hover:bg-white/30">
                <Sparkles className="mr-1 h-3 w-3" />
                {Math.round(estimate.confidence * 100)}%
              </Badge>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={editedKcal}
                onChange={(e) =>
                  setEditedKcal(Math.max(0, Number(e.target.value) || 0))
                }
                className="h-14 w-32 rounded-xl border-0 bg-white/20 text-3xl font-semibold text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white"
              />
              <span className="text-sm text-white/80">kcal · แก้ได้</span>
            </div>
          </section>

          {estimate.items.length > 0 && (
            <Card className="rounded-2xl border-none shadow-sm">
              <CardContent className="space-y-2 p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  รายการ
                </p>
                <ul className="space-y-1.5">
                  {estimate.items.map((it, i) => (
                    <li
                      key={i}
                      className="flex justify-between border-b py-1.5 text-sm last:border-0"
                    >
                      <span>
                        {it.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({it.portion})
                        </span>
                      </span>
                      <span className="font-medium">{it.kcal} kcal</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="grid grid-cols-3 gap-2 p-4">
              <Macro label="โปรตีน" value={estimate.macros.protein_g} tone="bg-emerald-100 text-emerald-700" />
              <Macro label="คาร์บ" value={estimate.macros.carb_g} tone="bg-amber-100 text-amber-700" />
              <Macro label="ไขมัน" value={estimate.macros.fat_g} tone="bg-rose-100 text-rose-700" />
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            * AI estimates ไม่ใช่คำแนะนำทางการแพทย์
          </p>

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
                onClick={reset}
                disabled={saving}
              >
                <RotateCcw /> เริ่มใหม่
              </Button>
              <Button
                size="lg"
                className="flex-1 rounded-xl"
                onClick={saveMeal}
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
        </>
      )}
    </div>
  );
}

function ModeCard({
  active,
  icon,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all",
        active
          ? "border-brand-400 bg-brand-50 shadow-sm"
          : "border-border bg-card hover:bg-accent/40",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          active ? "bg-brand-400 text-white" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </div>
      <p className={cn("text-sm font-semibold", active && "text-brand-700")}>
        {label}
      </p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </button>
  );
}

function Macro({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tone}`}>
        {label}
      </span>
      <p className="text-base font-semibold leading-none">
        {Math.round(value)}
        <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">
          g
        </span>
      </p>
    </div>
  );
}
