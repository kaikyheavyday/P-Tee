"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Loader2,
  LogOut,
  ChevronRight,
  Globe,
  Info,
  Pencil,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLiff } from "../providers/LiffProvider";

type MeResponse = {
  user: {
    line_user_id: string;
    display_name: string | null;
    daily_kcal_target: number;
    height_cm: number;
    weight_kg: number;
  };
};

export default function SettingsPage() {
  const { profile, logout, apiFetch, language, idToken } = useLiff();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idToken) return;
    let cancel = false;
    (async () => {
      try {
        const res = await apiFetch("/api/me");
        if (cancel) return;
        if (!res.ok) throw new Error(`error_${res.status}`);
        const json = (await res.json()) as MeResponse;
        setMe(json);
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : "load_failed");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [apiFetch, idToken]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="space-y-1 pt-2">
        <p className="text-xs text-muted-foreground">บัญชีของคุณ</p>
        <h1 className="text-2xl font-semibold">ตั้งค่า</h1>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile card */}
      <Card className="rounded-3xl border-none shadow-sm">
        <CardContent className="flex items-center gap-4 p-5">
          {profile?.pictureUrl ? (
            <Image
              src={profile.pictureUrl}
              alt={profile.displayName}
              width={64}
              height={64}
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-brand-200"
              unoptimized
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <User className="h-7 w-7 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">
              {profile?.displayName ?? "—"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.userId ?? ""}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Body composition */}
      <section className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          ข้อมูลร่างกาย
        </h2>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="divide-y divide-border/60 p-0">
            {loading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-40" />
              </div>
            ) : me ? (
              <>
                <Row label="ส่วนสูง" value={`${me.user.height_cm} cm`} />
                <Row label="น้ำหนัก" value={`${me.user.weight_kg} kg`} />
                <Row
                  label="เป้าหมายแคล/วัน"
                  value={`${me.user.daily_kcal_target.toLocaleString()} kcal`}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-xl"
          disabled
        >
          <Pencil /> แก้ไขข้อมูล (เร็วๆ นี้)
        </Button>
      </section>

      {/* Account */}
      <section className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          บัญชี
        </h2>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="divide-y divide-border/60 p-0">
            <Row
              icon={<Globe className="h-4 w-4 text-muted-foreground" />}
              label="ภาษา"
              value={language ?? "—"}
            />
            <Row
              icon={<Info className="h-4 w-4 text-muted-foreground" />}
              label="เวอร์ชัน"
              value="1.0.0"
            />
          </CardContent>
        </Card>
      </section>

      {/* Logout */}
      <Button
        variant="outline"
        size="lg"
        className="mt-2 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
        onClick={logout}
      >
        {profile == null ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <LogOut /> ออกจากระบบ
          </>
        )}
      </Button>

      {/* TODO: future identity features (edit profile, units, notifications, weight log, etc.) */}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <div className="flex items-center gap-2 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
        {value}
        <ChevronRight className="h-4 w-4 opacity-40" />
      </div>
    </div>
  );
}
