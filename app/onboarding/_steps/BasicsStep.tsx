"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import type { OnboardingForm } from "../_form";

export function BasicsStep({
  form,
  setForm,
  onNext,
}: {
  form: OnboardingForm;
  setForm: (patch: Partial<OnboardingForm>) => void;
  onNext: () => void;
}) {
  const heightN = Number(form.height_cm);
  const weightN = Number(form.weight_kg);
  const valid =
    !!form.gender &&
    !!form.birthdate &&
    heightN >= 120 && heightN <= 220 &&
    weightN >= 30 && weightN <= 200;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">ข้อมูลพื้นฐาน</h2>
        <p className="text-sm text-muted-foreground">
          เราใช้ข้อมูลนี้เพื่อคำนวณแคลอรี่ที่ควรกินต่อวัน
        </p>
      </div>

      <div className="space-y-3">
        <Label>เพศ</Label>
        <RadioGroup
          value={form.gender}
          onValueChange={(v) => setForm({ gender: v as OnboardingForm["gender"] })}
          className="grid grid-cols-2 gap-3"
        >
          <PillRadio value="male" current={form.gender} label="ชาย" />
          <PillRadio value="female" current={form.gender} label="หญิง" />
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthdate">วันเกิด</Label>
        <Input
          id="birthdate"
          type="date"
          max={today}
          value={form.birthdate}
          onChange={(e) => setForm({ birthdate: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="height">ส่วนสูง (ซม.)</Label>
          <Input
            id="height"
            type="number"
            inputMode="numeric"
            min={120}
            max={220}
            placeholder="170"
            value={form.height_cm}
            onChange={(e) => setForm({ height_cm: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">น้ำหนัก (กก.)</Label>
          <Input
            id="weight"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={30}
            max={200}
            placeholder="60"
            value={form.weight_kg}
            onChange={(e) => setForm({ weight_kg: e.target.value })}
          />
        </div>
      </div>

      <Button size="lg" disabled={!valid} onClick={onNext}>
        ถัดไป
      </Button>
    </div>
  );
}

function PillRadio({
  value,
  current,
  label,
}: {
  value: string;
  current: string;
  label: string;
}) {
  const selected = value === current;
  return (
    <Label
      htmlFor={`pill-${value}`}
      className={[
        "flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary/5 text-primary"
          : "border-input bg-background hover:bg-accent",
      ].join(" ")}
    >
      <RadioGroupItem id={`pill-${value}`} value={value} className="sr-only" />
      {label}
    </Label>
  );
}
