"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLiff } from "../providers/LiffProvider";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { isReady, isLoggedIn, login } = useLiff();

  useEffect(() => {
    if (isReady && !isLoggedIn) login();
  }, [isReady, isLoggedIn, login]);

  if (!isReady || !isLoggedIn) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังโหลด…
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-6">
      {children}
    </main>
  );
}
