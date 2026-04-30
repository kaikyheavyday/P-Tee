"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Liff } from "@line/liff";

export type LiffProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

type LiffContextValue = {
  liff: Liff | null;
  isReady: boolean;
  isLoggedIn: boolean;
  isInClient: boolean;
  profile: LiffProfile | null;
  error: string | null;
  os: string | null;
  language: string | null;
  login: () => void;
  logout: () => void;
};

const LiffContext = createContext<LiffContextValue | undefined>(undefined);

export function LiffProvider({ children }: { children: ReactNode }) {
  const [liff, setLiff] = useState<Liff | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInClient, setIsInClient] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [os, setOs] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      setError(
        "Missing NEXT_PUBLIC_LIFF_ID. Add it to .env.local and restart the dev server."
      );
      setIsReady(true);
      return;
    }

    (async () => {
      try {
        const mod = await import("@line/liff");
        const liffSdk = mod.default;
        await liffSdk.init({ liffId });
        if (cancelled) return;

        setLiff(liffSdk);
        setIsInClient(liffSdk.isInClient());
        setOs(liffSdk.getOS() ?? null);
        setLanguage(liffSdk.getLanguage());

        const loggedIn = liffSdk.isLoggedIn();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          const p = await liffSdk.getProfile();
          if (cancelled) return;
          setProfile({
            userId: p.userId,
            displayName: p.displayName,
            pictureUrl: p.pictureUrl,
            statusMessage: p.statusMessage,
          });
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setError(`LIFF init failed: ${msg}`);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(() => {
    if (!liff) return;
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.href });
    }
  }, [liff]);

  const logout = useCallback(() => {
    if (!liff) return;
    liff.logout();
    window.location.reload();
  }, [liff]);

  const value = useMemo<LiffContextValue>(
    () => ({
      liff,
      isReady,
      isLoggedIn,
      isInClient,
      profile,
      error,
      os,
      language,
      login,
      logout,
    }),
    [liff, isReady, isLoggedIn, isInClient, profile, error, os, language, login, logout]
  );

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
}

export function useLiff(): LiffContextValue {
  const ctx = useContext(LiffContext);
  if (!ctx) throw new Error("useLiff must be used inside <LiffProvider>");
  return ctx;
}
