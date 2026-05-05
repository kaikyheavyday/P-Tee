"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  UtensilsCrossed,
  Sun,
  CloudSun,
  Moon,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLiff } from "../providers/LiffProvider";

type Meal = {
  id: string;
  name: string;
  kcal: number;
  eaten_at: string;
  local_date: string;
  ai_confidence: number | null;
  edited_by_user: boolean;
};

type MeResponse = { user: { daily_kcal_target: number } };

function bangkokDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function lastDays(n: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d);
  }
  return out;
}

function bucketOf(eatenAt: string): "morning" | "lunch" | "dinner" | "other" {
  const h = new Date(eatenAt).getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 17 && h < 22) return "dinner";
  return "other";
}

const BUCKET_META: Record<
  "morning" | "lunch" | "dinner" | "other",
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  morning: { label: "เช้า", icon: Sun },
  lunch: { label: "กลางวัน", icon: CloudSun },
  dinner: { label: "เย็น", icon: Moon },
  other: { label: "อื่นๆ", icon: MoreHorizontal },
};

export default function MealsListPage() {
  const { apiFetch, idToken } = useLiff();
  const [date, setDate] = useState(bangkokDate(new Date()));
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [target, setTarget] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => lastDays(7), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mealsRes, meRes] = await Promise.all([
        apiFetch(`/api/meals?date=${date}`),
        apiFetch(`/api/me`),
      ]);
      const json = await mealsRes.json();
      if (!mealsRes.ok)
        throw new Error(json.error || `error_${mealsRes.status}`);
      setMeals(json.meals as Meal[]);
      if (meRes.ok) {
        const meJson = (await meRes.json()) as MeResponse;
        setTarget(meJson.user.daily_kcal_target);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, date]);

  useEffect(() => {
    if (!idToken) return;
    load();
  }, [idToken, load]);

  const total = useMemo(
    () => (meals || []).reduce((s, m) => s + m.kcal, 0),
    [meals],
  );
  const remaining = Math.max(0, target - total);

  const grouped = useMemo(() => {
    const buckets: Record<string, Meal[]> = {
      morning: [],
      lunch: [],
      dinner: [],
      other: [],
    };
    for (const m of meals || []) buckets[bucketOf(m.eaten_at)].push(m);
    return buckets;
  }, [meals]);

  const todayStr = bangkokDate(new Date());

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="space-y-1 pt-2">
        <p className="text-xs text-muted-foreground">รายการอาหาร</p>
        <h1 className="text-2xl font-semibold">มื้อของคุณ</h1>
      </header>

      {/* Date pills */}
      <div className="flex gap-2 overflow-x-auto">
        {days.map((d) => {
          const v = bangkokDate(d);
          const active = v === date;
          return (
            <button
              key={v}
              onClick={() => setDate(v)}
              className={cn(
                "flex min-w-14 flex-col items-center rounded-2xl border px-3 py-2 text-xs transition-colors",
                active
                  ? "border-brand-400 bg-brand-400 text-white shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              <span className="text-[10px] uppercase">
                {d.toLocaleDateString("th-TH", {
                  weekday: "short",
                  timeZone: "Asia/Bangkok",
                })}
              </span>
              <span className="text-lg font-semibold leading-none">
                {d.toLocaleDateString("th-TH", {
                  day: "numeric",
                  timeZone: "Asia/Bangkok",
                })}
              </span>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="rounded-2xl border-none bg-gradient-to-r from-brand-50 to-brand-100">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs text-brand-700">วันที่เลือก</p>
            <p className="text-xl font-semibold text-brand-700">
              {total.toLocaleString()}{" "}
              <span className="text-xs font-normal">kcal</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-brand-700">เหลือ</p>
            <p className="text-base font-semibold text-brand-700">
              {remaining.toLocaleString()}
              <span className="ml-0.5 text-xs font-normal">kcal</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : meals && meals.length > 0 ? (
        <div className="space-y-5">
          {(Object.keys(BUCKET_META) as Array<keyof typeof BUCKET_META>).map(
            (b) => {
              const items = grouped[b];
              if (!items || items.length === 0) return null;
              const Meta = BUCKET_META[b];
              const Icon = Meta.icon;
              const sum = items.reduce((s, m) => s + m.kcal, 0);
              return (
                <section key={b} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h2 className="flex-1 text-sm font-semibold">
                      {Meta.label}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {sum.toLocaleString()} kcal
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {items.map((m) => (
                      <li key={m.id}>
                        <Link href={`/meals/${m.id}`}>
                          <Card className="rounded-2xl transition-colors hover:bg-accent/50">
                            <CardContent className="flex items-center justify-between gap-3 p-4">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {m.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(m.eaten_at).toLocaleTimeString(
                                    "th-TH",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                  {m.edited_by_user && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 border-brand-300 text-brand-600"
                                    >
                                      แก้ไขแล้ว
                                    </Badge>
                                  )}
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
                </section>
              );
            },
          )}
        </div>
      ) : (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <UtensilsCrossed className="h-8 w-8 text-brand-400" />
            <p className="text-sm">ยังไม่มีรายการในวันนี้</p>
            <Link href="/add">
              <Button size="sm">เพิ่มอาหาร</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
