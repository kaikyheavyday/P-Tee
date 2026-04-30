"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLiff } from "../../providers/LiffProvider";
import {
  computeTargets,
  type Activity,
  type Gender,
  type Goal,
} from "@/lib/nutrition";
import type { OnboardingForm } from "../_form";

export function ConfirmStep({
  form,
  onBack,
}: {
  form: OnboardingForm;
  onBack: () => void;
}) {
  const { apiFetch, profile } = useLiff();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targets = useMemo(
    () =>
      computeTargets({
        gender: form.gender as Gender,
        birthdate: form.birthdate,
        heightCm: Number(form.height_cm),
        weightKg: Number(form.weight_kg),
        activity: form.activity as Activity,
        goal: form.goal as Goal,
      }),
    [form],
  );

  const bmiLabel: Record<typeof targets.bmiCategory, string> = {
    underweight: "น้ำหนักน้อย",
    normal: "ปกติ",
    overweight: "น้ำหนักเกิน",
    obese: "อ้วน",
  };

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/api/onboarding", {
        method: "POST",
        body: JSON.stringify({
          display_name: profile?.displayName,
          picture_url: profile?.pictureUrl,
          gender: form.gender,
          birthdate: form.birthdate,
          height_cm: Number(form.height_cm),
          weight_kg: Number(form.weight_kg),
          activity: form.activity,
          goal: form.goal,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `error_${res.status}`);
      }
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">สรุปข้อมูลของคุณ</h2>
        <p className="text-sm text-muted-foreground">
          ค่าเหล่านี้คำนวณตามสูตร Mifflin-St Jeor
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>เป้าหมายแคลอรี่ต่อวัน</CardDescription>
          <CardTitle className="text-4xl">
            {targets.dailyTarget.toLocaleString()}{" "}
            <span className="text-base font-normal text-muted-foreground">kcal</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3 text-center">
          <Stat label="BMI" value={targets.bmi.toFixed(1)} sub={bmiLabel[targets.bmiCategory]} />
          <Stat label="BMR" value={targets.bmr.toLocaleString()} sub="kcal" />
          <Stat label="TDEE" value={targets.tdee.toLocaleString()} sub="kcal" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 pt-6 text-sm">
          <Row label="เพศ" value={form.gender === "male" ? "ชาย" : "หญิง"} />
          <Row label="วันเกิด" value={form.birthdate} />
          <Row label="ส่วนสูง" value={`${form.height_cm} ซม.`} />
          <Row label="น้ำหนัก" value={`${form.weight_kg} กก.`} />
          <Row label="กิจกรรม" value={form.activity} />
          <Row label="เป้าหมาย" value={form.goal} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        เราเก็บส่วนสูง น้ำหนัก และรายการอาหารของคุณ เพื่อแสดงสรุปแคลอรี่เท่านั้น
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" disabled={submitting} onClick={onBack}>
          ย้อนกลับ
        </Button>
        <Button size="lg" disabled={submitting} onClick={submit}>
          {submitting ? <Loader2 className="animate-spin" /> : "ยืนยัน"}
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-1.5 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
