"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import type { OnboardingForm } from "../_form";

const ACTIVITIES: { value: string; label: string; desc: string }[] = [
  { value: "sedentary", label: "นั่งทำงานเป็นหลัก", desc: "แทบไม่ได้ออกกำลังกาย" },
  { value: "light", label: "ออกกำลังกายเบา ๆ", desc: "1-3 วัน/สัปดาห์" },
  { value: "moderate", label: "ออกกำลังกายปานกลาง", desc: "3-5 วัน/สัปดาห์" },
  { value: "active", label: "ออกกำลังกายหนัก", desc: "6-7 วัน/สัปดาห์" },
  { value: "very_active", label: "หนักมาก / นักกีฬา", desc: "ทุกวัน + งานใช้แรง" },
];

const GOALS: { value: string; label: string }[] = [
  { value: "lose", label: "ลดน้ำหนัก" },
  { value: "maintain", label: "คงน้ำหนัก" },
  { value: "gain", label: "เพิ่มน้ำหนัก" },
];

export function GoalStep({
  form,
  setForm,
  onBack,
  onNext,
}: {
  form: OnboardingForm;
  setForm: (patch: Partial<OnboardingForm>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const valid = !!form.activity && !!form.goal;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">เป้าหมาย</h2>
        <p className="text-sm text-muted-foreground">
          เลือกระดับการออกกำลังกายและเป้าหมายของคุณ
        </p>
      </div>

      <div className="space-y-3">
        <Label>กิจกรรมประจำวัน</Label>
        <RadioGroup
          value={form.activity}
          onValueChange={(v) => setForm({ activity: v as OnboardingForm["activity"] })}
          className="space-y-2"
        >
          {ACTIVITIES.map((a) => (
            <CardRadio
              key={a.value}
              value={a.value}
              current={form.activity}
              title={a.label}
              desc={a.desc}
            />
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>เป้าหมาย</Label>
        <RadioGroup
          value={form.goal}
          onValueChange={(v) => setForm({ goal: v as OnboardingForm["goal"] })}
          className="grid grid-cols-3 gap-2"
        >
          {GOALS.map((g) => (
            <PillRadio key={g.value} value={g.value} current={form.goal} label={g.label} />
          ))}
        </RadioGroup>
      </div>

      {form.goal !== "maintain" && form.goal !== "" && (
        <div className="space-y-2">
          <Label htmlFor="target">น้ำหนักเป้าหมาย (ไม่บังคับ)</Label>
          <Input
            id="target"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={30}
            max={200}
            placeholder="55"
            value={form.target_weight_kg}
            onChange={(e) => setForm({ target_weight_kg: e.target.value })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" onClick={onBack}>
          ย้อนกลับ
        </Button>
        <Button size="lg" disabled={!valid} onClick={onNext}>
          ถัดไป
        </Button>
      </div>
    </div>
  );
}

function CardRadio({
  value,
  current,
  title,
  desc,
}: {
  value: string;
  current: string;
  title: string;
  desc: string;
}) {
  const selected = value === current;
  return (
    <Label
      htmlFor={`act-${value}`}
      className={[
        "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-input bg-background hover:bg-accent",
      ].join(" ")}
    >
      <RadioGroupItem id={`act-${value}`} value={value} className="mt-1" />
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Label>
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
      htmlFor={`goal-${value}`}
      className={[
        "flex cursor-pointer items-center justify-center rounded-md border px-3 py-3 text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary/5 text-primary"
          : "border-input bg-background hover:bg-accent",
      ].join(" ")}
    >
      <RadioGroupItem id={`goal-${value}`} value={value} className="sr-only" />
      {label}
    </Label>
  );
}
