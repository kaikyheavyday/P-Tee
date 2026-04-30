# P-Tee — LINE LIFF Mini App (Next.js)

A LINE LIFF mini app built with Next.js 15 (App Router), TypeScript and Tailwind CSS. Authorizes users via LINE Login and shows their profile inside the LINE in-app browser.

## 1. Install

```bash
pnpm install
```

## 2. Create a LIFF app on LINE Developers Console

1. Go to https://developers.line.biz/console/ and sign in.
2. Create (or pick) a **Provider**.
3. Create a new channel of type **LINE Login**.
4. Open the channel → **LIFF** tab → **Add**.
   - **LIFF app name**: anything (e.g. `P-Tee dev`)
   - **Size**: `Full`
   - **Endpoint URL**: your HTTPS dev URL (see step 3 — e.g. `https://xxxx.ngrok-free.app`)
   - **Scopes**: check `profile` and `openid`
   - **Bot link feature**: Off (unless you need it)
5. Copy the generated **LIFF ID** (looks like `1234567890-AbCdEfGh`).

## 3. Run locally with HTTPS (ngrok)

LIFF requires HTTPS. In one terminal:

```bash
pnpm dev
```

In a second terminal:

```bash
ngrok http 3000
```

Copy the `https://...ngrok-free.app` URL into the LIFF app's **Endpoint URL** field on the LINE Console (you can update it any time).

## 4. Configure env

```bash
cp .env.local.example .env.local
```

Then set:

```
NEXT_PUBLIC_LIFF_ID=1234567890-AbCdEfGh
```

Restart `pnpm dev` after editing `.env.local`.

## 5. Test inside LINE

Open this URL on your phone in the LINE app (e.g. send it to yourself in a chat and tap it):

```
https://liff.line.me/<YOUR_LIFF_ID>
```

- First time: LINE shows a consent screen.
- After approving, the app shows your name, avatar, userId, and confirms `In LINE App: Yes`.

You can also open the same URL in a regular browser — it will redirect through LINE Login OAuth.

## 6. Deploy

Deploy to Vercel (or any host with HTTPS), then update the LIFF **Endpoint URL** in the LINE Console to your production URL. Set `NEXT_PUBLIC_LIFF_ID` in the host's environment variables.

## Project structure

- `app/layout.tsx` — root layout, wraps the app in `LiffProvider`.
- `app/page.tsx` — login button / profile card UI.
- `app/providers/LiffProvider.tsx` — client-only LIFF context (`useLiff()` hook).
- `app/globals.css` — Tailwind base.

## Scripts

- `pnpm dev` — start Next.js dev server on `localhost:3000`
- `pnpm build` — production build
- `pnpm start` — start production server
- `pnpm lint` — lint
