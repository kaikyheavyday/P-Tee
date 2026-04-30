"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, LogOut, Plus } from "lucide-react";
import { useLiff } from "./providers/LiffProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type MeResponse = {
  user: {
    line_user_id: string;
    display_name: string | null;
    daily_kcal_target: number;
    height_cm: number;
    weight_kg: number;
  };
};

export default function Home() {
  const {
    isReady,
    isLoggedIn,
    profile,
    error,
    login,
    logout,
    apiFetch,
    idToken,
  } = useLiff();
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [meError, setMeError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isLoggedIn || !idToken) return;
    let cancel = false;
    (async () => {
      setMeLoading(true);
      try {
        const res = await apiFetch("/api/me");
        if (cancel) return;
        if (res.status === 404) {
          router.replace("/onboarding");
          return;
        }
        if (!res.ok) {
          setMeError(`โหลดข้อมูลไม่สำเร็จ (${res.status})`);
          return;
        }
        const data = (await res.json()) as MeResponse;
        setMe(data);
      } catch (e) {
        if (!cancel)
          setMeError(e instanceof Error ? e.message : "unknown error");
      } finally {
        if (!cancel) setMeLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [isReady, isLoggedIn, idToken, apiFetch, router]);

  if (!isReady) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing LIFF…
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <Alert variant="destructive">
          <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Shell>
    );
  }

  if (!isLoggedIn) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>เข้าสู่ระบบด้วย LINE</CardTitle>
            <CardDescription>เริ่มติดตามแคลอรี่ในแชทไลน์ของคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={login} className="w-full" size="lg">
              เข้าสู่ระบบด้วย LINE
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }
  console.log(me);
  return (
    <Shell>
      <header className="flex items-center gap-3">
        {profile?.pictureUrl ? (
          <Image
            src={profile.pictureUrl}
            alt={profile.displayName}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full ring-2 ring-primary/30"
            unoptimized
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-muted" />
        )}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">สวัสดี</p>
          <h1 className="text-base font-semibold leading-tight">
            {profile?.displayName ?? "—"}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="ออกจากระบบ"
        >
          <LogOut />
        </Button>
      </header>

      {meError && (
        <Alert variant="destructive">
          <AlertDescription>{meError}</AlertDescription>
        </Alert>
      )}

      {meLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ) : me ? (
        <>
          <Card>
            <CardHeader>
              <CardDescription>เป้าหมายแคลอรี่ต่อวัน</CardDescription>
              <CardTitle className="text-3xl">
                {me.user.daily_kcal_target}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  kcal
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ส่วนสูง {me.user.height_cm} cm · น้ำหนัก {me.user.weight_kg} kg
              </p>
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" disabled>
            <Plus /> เพิ่มอาหาร (เร็ว ๆ นี้)
          </Button>
        </>
      ) : null}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-5 py-8">
      {children}
    </main>
  );
}
