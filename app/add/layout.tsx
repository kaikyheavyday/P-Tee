"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLiff } from "../providers/LiffProvider";
import { BottomNav } from "@/components/bottom-nav";

export default function AddLayout({ children }: { children: React.ReactNode }) {
  const { isReady, isLoggedIn, login, apiFetch, idToken } = useLiff();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) {
      login();
      return;
    }
    if (!idToken) return;
    let cancel = false;
    (async () => {
      const res = await apiFetch("/api/me");
      if (cancel) return;
      if (res.status === 404) router.replace("/onboarding");
      else setChecked(true);
    })();
    return () => {
      cancel = true;
    };
  }, [isReady, isLoggedIn, idToken, apiFetch, login, router]);

  return (
    <>
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-safe-nav">
        {!isReady || !isLoggedIn || !checked ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังโหลด…
          </div>
        ) : (
          children
        )}
      </main>
      <BottomNav />
    </>
  );
}
