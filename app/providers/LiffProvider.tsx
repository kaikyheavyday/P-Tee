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
  idToken: string | null;
  login: () => void;
  logout: () => void;
  /** fetch helper that auto-attaches Authorization: Bearer <idToken>. */
  apiFetch: (input: string, init?: RequestInit) => Promise<Response>;
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
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    // ── Dev mock ──────────────────────────────────────────────────────────────
    if (process.env.NEXT_PUBLIC_LIFF_MOCK === "true") {
      setIsLoggedIn(true);
      setIsInClient(false);
      setOs("web");
      setLanguage("th");
      setIdToken("mock_dev_token");
      setProfile({
        userId: process.env.NEXT_PUBLIC_LIFF_MOCK_USER_ID ?? "Umock_dev_user",
        displayName:
          process.env.NEXT_PUBLIC_LIFF_MOCK_DISPLAY_NAME ?? "Dev User",
        pictureUrl: process.env.NEXT_PUBLIC_LIFF_MOCK_PICTURE_URL ?? undefined,
      });
      setIsReady(true);
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    let cancelled = false;

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      setError(
        "Missing NEXT_PUBLIC_LIFF_ID. Add it to .env.local and restart the dev server.",
      );
      setIsReady(true);
      return;
    }

    (async () => {
      try {
        const mod = await import("@line/liff");
        const liffSdk = mod.default;
        await liffSdk.init({ liffId, withLoginOnExternalBrowser: true });
        if (cancelled) return;

        setLiff(liffSdk);
        setIsInClient(liffSdk.isInClient());
        setOs(liffSdk.getOS() ?? null);
        setLanguage(liffSdk.getLanguage());

        const loggedIn = liffSdk.isLoggedIn();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          setIdToken(liffSdk.getIDToken());
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
      const url = new URL(window.location.href);
      const isOAuthCallback =
        url.searchParams.has("code") ||
        url.searchParams.has("state") ||
        url.searchParams.has("liff.state") ||
        url.searchParams.has("liffClientId");

      // Prevent restarting login while handling callback params.
      if (isOAuthCallback) return;

      const cleanRedirectUri = `${url.origin}${url.pathname}`;
      liff.login({ redirectUri: cleanRedirectUri });
    }
  }, [liff]);

  const logout = useCallback(() => {
    if (!liff) return;
    liff.logout();
    window.location.reload();
  }, [liff]);

  const apiFetch = useCallback(
    async (input: string, init?: RequestInit) => {
      const token = liff?.isLoggedIn() ? liff.getIDToken() : idToken;
      const headers = new Headers(init?.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      if (init?.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      return fetch(input, { ...init, headers });
    },
    [liff, idToken],
  );

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
      idToken,
      login,
      logout,
      apiFetch,
    }),
    [
      liff,
      isReady,
      isLoggedIn,
      isInClient,
      profile,
      error,
      os,
      language,
      idToken,
      login,
      logout,
      apiFetch,
    ],
  );

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
}

export function useLiff(): LiffContextValue {
  const ctx = useContext(LiffContext);
  if (!ctx) throw new Error("useLiff must be used inside <LiffProvider>");
  return ctx;
}
