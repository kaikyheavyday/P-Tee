"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, CalendarDays, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLiff } from "../providers/LiffProvider";

type Range = "7d" | "30d";

type SummaryPoint = {
  date: string;
  kcal: number;
};

type SummaryResponse = {
  series: SummaryPoint[];
  daily_target: number | null;
};

const RANGE_OPTIONS: Array<{ value: Range; label: string; title: string }> = [
  { value: "7d", label: "อาทิตย์", title: "รอบอาทิตย์" },
  { value: "30d", label: "เดือน", title: "รอบเดือน" },
];

export default function SummaryPage() {
  const { apiFetch, idToken } = useLiff();
  const [range, setRange] = useState<Range>("7d");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/summary?range=${range}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `error_${res.status}`);
      setSummary(json as SummaryResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดสรุปไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, range]);

  useEffect(() => {
    if (!idToken) return;
    load();
  }, [idToken, load]);

  const stats = useMemo(() => {
    const series = summary?.series ?? [];
    const total = series.reduce((sum, item) => sum + item.kcal, 0);
    const loggedDays = series.filter((item) => item.kcal > 0).length;
    const average = series.length > 0 ? Math.round(total / series.length) : 0;
    const target = summary?.daily_target ?? 0;
    const onTargetDays = target
      ? series.filter((item) => item.kcal > 0 && item.kcal <= target).length
      : 0;
    const maxKcal = Math.max(target, ...series.map((item) => item.kcal), 1);
    return { total, loggedDays, average, target, onTargetDays, maxKcal };
  }, [summary]);

  const activeRange = RANGE_OPTIONS.find((item) => item.value === range);

  return (
    <div className="flex flex-1 flex-col gap-4 pb-4">
      <header className="space-y-1 pt-2">
        <p className="text-xs text-muted-foreground">สรุปการกิน</p>
        <h1 className="text-2xl font-semibold">
          สรุปการกินของ{activeRange?.title}
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
        {RANGE_OPTIONS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setRange(item.value)}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              range === item.value
                ? "bg-background text-brand-700 shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <SummarySkeleton />
      ) : summary ? (
        <>
          <Card className="rounded-2xl border-brand-100 bg-brand-50">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-brand-700">
                    พลังงานรวม
                  </p>
                  <p className="mt-1 text-4xl font-semibold leading-none text-brand-700">
                    {stats.total.toLocaleString()}
                    <span className="ml-1 text-sm font-normal">kcal</span>
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-brand-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm text-brand-700/80">
                เฉลี่ย {stats.average.toLocaleString()} kcal ต่อวัน
                {stats.target ? ` จากเป้าหมาย ${stats.target.toLocaleString()} kcal` : ""}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-2">
            <StatCard
              icon={CalendarDays}
              label="วันที่บันทึก"
              value={stats.loggedDays.toLocaleString()}
              suffix="วัน"
            />
            <StatCard
              icon={Target}
              label="ตรงเป้า"
              value={stats.onTargetDays.toLocaleString()}
              suffix="วัน"
            />
            <StatCard
              icon={BarChart3}
              label="เฉลี่ย"
              value={stats.average.toLocaleString()}
              suffix="kcal"
            />
          </div>

          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">แนวโน้มรายวัน</h2>
                <span className="text-xs text-muted-foreground">
                  {activeRange?.title}
                </span>
              </div>

              {summary.series.some((item) => item.kcal > 0) ? (
                <div className="flex h-44 items-end gap-1.5 border-b border-border/70 pb-2">
                  {summary.series.map((item) => (
                    <DailyBar
                      key={item.date}
                      point={item}
                      maxKcal={stats.maxKcal}
                      compact={range === "30d"}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-44 flex-col items-center justify-center rounded-2xl border border-dashed text-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 text-brand-400" />
                  <p className="mt-2 text-sm">ยังไม่มีข้อมูลในช่วงนี้</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <Card className="rounded-2xl border-brand-100 shadow-sm">
      <CardContent className="p-3 text-center">
        <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon className="h-4 w-4" />
        </span>
        <p className="mt-2 text-[10px] font-medium text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-lg font-semibold leading-none">
          {value}
          <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">
            {suffix}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

function DailyBar({
  point,
  maxKcal,
  compact,
}: {
  point: SummaryPoint;
  maxKcal: number;
  compact: boolean;
}) {
  const height = Math.max(4, Math.round((point.kcal / maxKcal) * 100));
  const day = new Date(`${point.date}T00:00:00`).toLocaleDateString("th-TH", {
    day: "numeric",
  });

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
      <div className="flex h-36 w-full items-end rounded-full bg-muted/60">
        <div
          className={cn(
            "w-full rounded-full bg-brand-400 transition-[height] duration-500",
            point.kcal === 0 && "bg-muted-foreground/25",
          )}
          style={{ height: `${height}%` }}
          title={`${point.date}: ${point.kcal.toLocaleString()} kcal`}
        />
      </div>
      {!compact || Number(day) % 5 === 0 ? (
        <span className="text-[10px] text-muted-foreground">{day}</span>
      ) : (
        <span className="h-3" aria-hidden />
      )}
    </div>
  );
}