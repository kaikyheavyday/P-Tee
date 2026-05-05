"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Settings as SettingsIcon, ChevronRight, Flame } from "lucide-react";
import { useLiff } from "./providers/LiffProvider";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type Meal = {
  id: string;
  name: string;
  kcal: number;
  protein_g: number | null;
  carb_g: number | null;
  fat_g: number | null;
  eaten_at: string;
};

function todayBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function thaiGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "เช้า";
  if (h < 17) return "บ่าย";
  return "เย็น";
}

export default function Home() {
  const { isReady, isLoggedIn, profile, error, login, apiFetch, idToken } =
    useLiff();
  const router = useRouter();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isLoggedIn || !idToken) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const meRes = await apiFetch("/api/me");
        if (cancel) return;
        if (meRes.status === 404) {
          router.replace("/onboarding");
          return;
        }
        if (!meRes.ok) throw new Error(`me_${meRes.status}`);
        const meJson = (await meRes.json()) as MeResponse;
        if (cancel) return;
        setMe(meJson);

        const mealsRes = await apiFetch(`/api/meals?date=${todayBangkok()}`);
        if (cancel) return;
        if (mealsRes.ok) {
          const mealsJson = await mealsRes.json();
          setMeals(mealsJson.meals as Meal[]);
        } else {
          setMeals([]);
        }
      } catch (e) {
        if (!cancel) setPageError(e instanceof Error ? e.message : "load_failed");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [isReady, isLoggedIn, idToken, apiFetch, router]);

  const totals = useMemo(() => {
    const list = meals || [];
    return {
      kcal: list.reduce((s, m) => s + m.kcal, 0),
      protein: list.reduce((s, m) => s + (m.protein_g || 0), 0),
      carb: list.reduce((s, m) => s + (m.carb_g || 0), 0),
      fat: list.reduce((s, m) => s + (m.fat_g || 0), 0),
    };
  }, [meals]);

  if (!isReady) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังโหลด…
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
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-100">
            <Flame className="h-12 w-12 text-brand-500" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">ยินดีต้อนรับสู่ P-Tee</h1>
            <p className="text-sm text-muted-foreground">
              ติดตามแคลอรี่รายวันได้ในแชทไลน์
            </p>
          </div>
          <Button onClick={login} className="w-full" size="lg">
            เข้าสู่ระบบด้วย LINE
          </Button>
        </div>
      </Shell>
    );
  }

  const target = me?.user.daily_kcal_target ?? 0;
  const remaining = Math.max(0, target - totals.kcal);
  const percent = target > 0 ? Math.min(100, (totals.kcal / target) * 100) : 0;
  const recent = (meals || []).slice(0, 3);

  return (
    <>
    <Shell>
      <header className="flex items-center gap-3 pt-2">
        {profile?.pictureUrl ? (
          <Image
            src={profile.pictureUrl}
            alt={profile.displayName}
            width={48}
            height={48}
            className="h-12 w-12 rounded-2xl object-cover ring-2 ring-brand-200"
            unoptimized
          />
        ) : (
          <div className="h-12 w-12 rounded-2xl bg-muted" />
        )}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">สวัสดีตอน{thaiGreeting()}</p>
          <h1 className="text-base font-semibold leading-tight">
            {profile?.displayName ?? "—"}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/settings")}
          aria-label="ตั้งค่า"
          className="rounded-full"
        >
          <SettingsIcon />
        </Button>
      </header>

      {pageError && (
        <Alert variant="destructive">
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Skeleton className="h-44 w-full rounded-3xl" />
      ) : (
        <section
          className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, #FFB85C 0%, #FF8A0D 60%, #FF6B00 100%)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white/80">
                แคลวันนี้
              </p>
              <p className="mt-1 text-3xl font-semibold leading-none">
                {totals.kcal.toLocaleString()}
                <span className="ml-1 text-sm font-normal text-white/80">kcal</span>
              </p>
              <p className="mt-3 text-xs text-white/80">
                เป้าหมาย {target.toLocaleString()} kcal
              </p>
              <p className="text-sm font-medium">
                เหลืออีก {remaining.toLocaleString()} kcal
              </p>
            </div>
            <Ring percent={percent} />
          </div>
        </section>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <MacroCard label="โปรตีน" value={totals.protein} color="bg-emerald-100 text-emerald-700" />
          <MacroCard label="คาร์บ" value={totals.carb} color="bg-amber-100 text-amber-700" />
          <MacroCard label="ไขมัน" value={totals.fat} color="bg-rose-100 text-rose-700" />
        </div>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">วันนี้คุณกินอะไรบ้าง</h2>
          <Link
            href="/meals"
            className="flex items-center text-xs font-medium text-brand-600"
          >
            ดูทั้งหมด <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-14 rounded-2xl" />
          </div>
        ) : recent.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <Flame className="h-6 w-6 text-brand-400" />
              <p className="text-sm">ยังไม่มีรายการ — แตะปุ่ม + ด้านล่างเพื่อเริ่ม</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {recent.map((m) => (
              <li key={m.id}>
                <Link href={`/meals/${m.id}`}>
                  <Card className="rounded-2xl transition-colors hover:bg-accent/50">
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.eaten_at).toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                        {m.kcal} kcal
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
    <BottomNav />
  </>
  );
}

function Ring({ percent }: { percent: number }) {
  const size = 96;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          fill="none"
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-base font-semibold">
        {Math.round(percent)}%
      </div>
    </div>
  );
}

function MacroCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardContent className="flex flex-col items-center gap-1 p-3 text-center">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}>
          {label}
        </span>
        <p className="text-lg font-semibold leading-none">
          {Math.round(value)}
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">g</span>
        </p>
      </CardContent>
    </Card>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-5 pt-6 pb-safe-nav">
      {children}
    </main>
  );
}
