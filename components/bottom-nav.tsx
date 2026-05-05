"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Plus, Settings } from "lucide-react";
import { useLiff } from "@/app/providers/LiffProvider";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "หน้าแรก", icon: Home },
  { href: "/meals", label: "รายการ", icon: UtensilsCrossed },
] as const;

const RIGHT_ITEMS = [
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
] as const;

const HIDDEN_PREFIXES = ["/onboarding"];

export function BottomNav() {
  const pathname = usePathname() || "/";
  const { isReady, isLoggedIn } = useLiff();

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (!isReady || !isLoggedIn) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const addActive = pathname.startsWith("/add");

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="pointer-events-auto mx-auto flex h-20 w-full max-w-md items-end justify-around border-t border-border/70 bg-background/85 px-3 backdrop-blur-md">
        <NavItem item={ITEMS[0]} active={isActive(ITEMS[0].href)} />
        <NavItem item={ITEMS[1]} active={isActive(ITEMS[1].href)} />
        <Link
          href="/add"
          aria-label="เพิ่มอาหาร"
          aria-current={addActive ? "page" : undefined}
          className={cn(
            "-mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-brand-400 text-white shadow-[0_10px_25px_-8px_rgba(255,168,64,0.7)] ring-4 ring-background transition-transform active:scale-95",
            addActive && "ring-brand-100",
          )}
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </Link>
        <NavItem item={RIGHT_ITEMS[0]} active={isActive(RIGHT_ITEMS[0].href)} />
        <PlaceholderSlot />
      </div>
    </nav>
  );
}

function NavItem({
  item,
  active,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors",
        active ? "text-brand-500" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
      <span>{item.label}</span>
    </Link>
  );
}

function PlaceholderSlot() {
  // Symmetry filler so the right side mirrors the left around the centered FAB.
  return <span className="flex-1" aria-hidden />;
}
