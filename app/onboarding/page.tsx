"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { initialForm, type OnboardingForm } from "./_form";
import { BasicsStep } from "./_steps/BasicsStep";
import { GoalStep } from "./_steps/GoalStep";
import { ConfirmStep } from "./_steps/ConfirmStep";

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setFormState] = useState<OnboardingForm>(initialForm);

  const setForm = (patch: Partial<OnboardingForm>) =>
    setFormState((f) => ({ ...f, ...patch }));

  const progress = (step / 3) * 100;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        {step > 1 ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="ย้อนกลับ"
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
          >
            <ArrowLeft />
          </Button>
        ) : (
          <div className="w-10" />
        )}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">ขั้นตอน {step} / 3</p>
          <Progress value={progress} className="mt-1" />
        </div>
      </div>

      {step === 1 && (
        <BasicsStep form={form} setForm={setForm} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <GoalStep
          form={form}
          setForm={setForm}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && <ConfirmStep form={form} onBack={() => setStep(2)} />}
    </div>
  );
}
