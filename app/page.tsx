"use client";

import Image from "next/image";
import { useLiff } from "./providers/LiffProvider";

export default function Home() {
  const {
    isReady,
    isLoggedIn,
    isInClient,
    profile,
    error,
    os,
    language,
    login,
    logout,
  } = useLiff();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-line text-white font-bold shadow-sm">
          L
        </div>
        <div>
          <h1 className="text-xl font-semibold leading-tight">P-Tee</h1>
          <p className="text-xs text-slate-500">LINE LIFF · Next.js</p>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isReady ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-line" />
            Initializing LIFF…
          </div>
        </div>
      ) : isLoggedIn && profile ? (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col items-center text-center">
            {profile.pictureUrl ? (
              <Image
                src={profile.pictureUrl}
                alt={profile.displayName}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full ring-4 ring-line/20"
                unoptimized
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-3xl font-semibold text-slate-500">
                {profile.displayName.charAt(0)}
              </div>
            )}
            <h2 className="mt-4 text-lg font-semibold">
              {profile.displayName}
            </h2>
            {profile.statusMessage && (
              <p className="mt-1 text-sm text-slate-500">
                “{profile.statusMessage}”
              </p>
            )}
          </div>

          <dl className="mt-6 space-y-2 text-sm">
            <Row label="User ID" value={profile.userId} mono />
            <Row label="In LINE App" value={isInClient ? "Yes" : "No"} />
            <Row label="OS" value={os ?? "-"} />
            <Row label="Language" value={language ?? "-"} />
          </dl>

          <button
            onClick={logout}
            className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition active:scale-[0.99] hover:bg-slate-800"
          >
            Log out
          </button>
        </section>
      ) : (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Welcome</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in with your LINE account to continue.
          </p>
          <button
            onClick={login}
            className="mt-5 w-full rounded-xl bg-line py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] hover:bg-line-dark"
          >
            Log in with LINE
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">
            {isInClient
              ? "Running inside LINE app"
              : "Tip: open this URL inside LINE for the full experience"}
          </p>
        </section>
      )}

      <footer className="mt-auto pt-8 text-center text-xs text-slate-400">
        Built with Next.js · @line/liff
      </footer>
    </main>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`max-w-[60%] truncate text-right text-slate-900 ${
          mono ? "font-mono text-xs" : ""
        }`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
