# P-Tee — AI Calorie Tracker (LINE LIFF)

> Type Thai food in LINE → AI estimates calories → auto-saved to your daily log.
> Example: user types `กระเพราไก่ไข่ดาว` → app replies `~650 kcal` and logs it.

---

## 1. Vision

A frictionless calorie tracker that lives **inside LINE**. No separate app to install, no manual database lookup. Users describe food in natural Thai (or English), AI estimates calories, and the app tracks daily intake against a personalized BMR/TDEE goal calculated from their profile.

**Core loop:**

```
User opens LIFF → types food (or snaps photo) → AI estimates kcal → save → see today's progress vs goal
```

---

## 2. User Journey

### 2.1 First-time (Onboarding)

1. User opens LIFF via `https://miniapp.line.me/<LIFF_ID>` (rich menu / shared link).
2. `liff.login()` → grant `profile` + `openid`.
3. Backend lookup by LINE `userId` → **new user** → redirect to `/onboarding`.
4. **Onboarding wizard (3 steps)**:
   - **Basics**: gender, date of birth, height (cm), weight (kg)
   - **Goal**: activity level, goal (lose / maintain / gain), target weight (optional)
   - **Confirm**: shows BMI, BMR, TDEE, daily kcal target → Save
5. Land on **Today** screen.

### 2.2 Returning user

Auto-login → load profile → Today screen with progress ring + meals list + "+Add" CTA.

### 2.3 Logging a meal — text

1. Tap **+Add food** → text input + portion selector (1 จาน / 0.5 / custom g).
2. Type `กระเพราไก่ไข่ดาว` → submit.
3. `POST /api/estimate` → LLM returns:
   ```json
   {
     "name": "กระเพราไก่ไข่ดาว",
     "items": [
       { "name": "ข้าวกระเพราไก่", "kcal": 480, "portion": "1 จาน" },
       { "name": "ไข่ดาว", "kcal": 170, "portion": "1 ฟอง" }
     ],
     "total_kcal": 650,
     "confidence": 0.82,
     "macros": { "protein_g": 32, "carb_g": 65, "fat_g": 28 }
   }
   ```
4. Preview → confirm (or edit kcal) → `POST /api/meals`.
5. Today updates · toast `+650 kcal · เหลืออีก 1,350 kcal`.

### 2.4 Logging a meal — photo

1. Tap camera icon → pick photo (or `liff.scanCodeV2` is for QR; use plain `<input type="file" capture>`).
2. Image base64 → `POST /api/estimate-photo`.
3. OpenAI vision identifies dish → same JSON shape as text path.
4. Preview / confirm / save.

### 2.5 Daily reset

Local midnight (Bangkok). History persists.

---

## 3. Core Calculations

### BMI

`BMI = weight_kg / (height_m)^2`

WHO Asian-adjusted: `<18.5` underweight · `18.5–22.9` normal · `23–24.9` overweight · `≥25` obese.

### BMR (Mifflin-St Jeor)

- Male:   `10w + 6.25h - 5a + 5`
- Female: `10w + 6.25h - 5a - 161`

### TDEE

`TDEE = BMR × activity_factor`

| Activity | Factor |
| --- | --- |
| Sedentary | 1.2 |
| Light | 1.375 |
| Moderate | 1.55 |
| Active | 1.725 |
| Very active | 1.9 |

### Daily kcal target

- Maintain → `TDEE`
- Lose → `TDEE − 500` (≈ 0.5 kg/week)
- Gain → `TDEE + 300`
- Floor: 1,200 (F) / 1,500 (M)

---

## 4. Information Architecture

```
/                  Today (progress ring + meals + +Add)
/onboarding        3-step wizard
/add               Text / photo input + AI preview
/history           7d / 30d chart + meal history
/profile           Edit profile / recompute target / delete data
```

---

## 5. Data Model (Supabase / Postgres)

### `users`

| field | type | note |
| --- | --- | --- |
| `line_user_id` | text PK | from `liff.getProfile().userId` |
| `display_name` | text | |
| `picture_url` | text | |
| `gender` | text check (`male`,`female`) | |
| `birthdate` | date | |
| `height_cm` | int | |
| `weight_kg` | numeric | |
| `activity` | text check (`sedentary`,`light`,`moderate`,`active`,`very_active`) | |
| `goal` | text check (`lose`,`maintain`,`gain`) | |
| `daily_kcal_target` | int | computed; recompute on profile change |
| `timezone` | text | default `Asia/Bangkok` |
| `created_at` / `updated_at` | timestamptz | |

### `meals`

| field | type | note |
| --- | --- | --- |
| `id` | uuid PK | |
| `line_user_id` | text FK → users | |
| `eaten_at` | timestamptz | default now |
| `local_date` | date | for fast daily aggregate |
| `input_text` | text | original user input (nullable for photo-only) |
| `image_url` | text | if photo (Supabase Storage) |
| `name` | text | normalized name |
| `kcal` | int | final value (after user edit) |
| `protein_g` / `carb_g` / `fat_g` | numeric | nullable |
| `ai_raw` | jsonb | full LLM response |
| `ai_confidence` | numeric | |
| `edited_by_user` | bool | |

### `weight_logs` (v0.3)

`(line_user_id text FK, date date, weight_kg numeric, primary key (line_user_id, date))`

### Row-Level Security

Tables locked down — only the **service-role key** (server-side) can read/write. Frontend never talks directly to Supabase. Auth happens via LIFF ID token verified server-side.

---

## 6. Backend API (Next.js Route Handlers)

All routes require `Authorization: Bearer <liff_id_token>`. Server verifies via:

```
POST https://api.line.me/oauth2/v2.1/verify
  id_token=<token>&client_id=<LINE_LOGIN_CHANNEL_ID>
```

→ extract `sub` = `line_user_id`. Reject if invalid.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/me` | Current user (404 if not onboarded) |
| `POST` | `/api/onboarding` | Create user, compute target |
| `PATCH` | `/api/me` | Update profile, recompute target |
| `DELETE` | `/api/me` | Delete user + all meals |
| `POST` | `/api/estimate` | Text → kcal estimate |
| `POST` | `/api/estimate-photo` | Image (base64) → kcal estimate |
| `POST` | `/api/meals` | Save confirmed meal |
| `GET` | `/api/meals?date=YYYY-MM-DD` | List meals for a day |
| `DELETE` | `/api/meals/:id` | Remove a meal |
| `GET` | `/api/summary?range=7d` | Daily totals for chart |
| `POST` | `/api/push/daily` | Internal cron — push 8 PM summary |

---

## 7. AI Estimation

### Provider

**OpenAI `gpt-4o-mini`** — cheap, fast, supports Thai, supports structured JSON output, supports vision (single provider for both text and photo paths).

### Prompt (system)

```
You are a Thai nutritionist. The user describes (or shows a photo of) food.
Return ONLY valid JSON matching this schema:
{
  "name": string,
  "items": [{ "name": string, "kcal": int, "portion": string }],
  "total_kcal": int,
  "confidence": number 0..1,
  "macros": { "protein_g": number, "carb_g": number, "fat_g": number }
}
Use realistic Thai street-food portions. If ambiguous, assume 1 standard serving.
If you cannot identify the food, set confidence < 0.4 and best-guess kcal.
```

### Hardening

- `response_format: { type: "json_schema", ... }` — no parse failures
- Cache by `sha256(normalized_text + portion)` (text path only) → same input never re-bills
- Rate limit per `line_user_id`: 30 req / 5 min
- Always show **confidence** + **edit kcal** affordance — AI is a suggestion, not truth
- Photo path: store image in Supabase Storage bucket `meal-photos` for audit / future learning

---

## 8. UI / UX

- Mobile-first (LIFF webview ~360–430px)
- Progress ring on Today: green / orange / red by % of target
- Recent meals quick-add chips (one tap to relog)
- Empty state with sample suggestion ("ลองพิมพ์: ผัดกะเพราไก่")
- Always confirm before saving — never silently log AI guess
- Share weekly summary via `liff.shareTargetPicker`

---

## 9. Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 App Router |
| Auth | LIFF + ID token verify on backend |
| DB | Supabase (Postgres + Storage) |
| LLM | OpenAI `gpt-4o-mini` (text + vision) |
| Push | LINE Messaging API (separate channel) |
| Style | Tailwind |
| State | React Context + SWR |
| Hosting | Vercel |
| Charts | recharts |

---

## 10. Phased Roadmap

### v0.1 MVP — "Type / snap and log"

- [x] LIFF auth + profile
- [x] Backend foundations: Supabase, ID-token verification, /api/me, /api/onboarding, /api/meals, /api/estimate, /api/estimate-photo
- [ ] Onboarding wizard UI
- [ ] Today screen with progress ring
- [ ] /add page (text + photo)
- [ ] /history with chart
- [ ] /profile (edit + delete)

### v0.2 — Engagement

- [ ] LINE Messaging push reminder at 8 PM (Vercel cron → /api/push/daily)
- [ ] Weekly summary share
- [ ] Recent meals quick-add chips
- [ ] Macro breakdown UI

### v0.3 — Smart

- [ ] Weight trend chart (`weight_logs`)
- [ ] Personalized portion learning
- [ ] Voice input (Thai dictation via Web Speech API)

---

## 11. Privacy & Safety

- Store only `line_user_id` (no email / phone)
- Onboarding consent: "เราเก็บส่วนสูง น้ำหนัก และรายการอาหารของคุณ เพื่อแสดงสรุปแคลอรี่"
- **Delete my data** in `/profile` → `DELETE /api/me` wipes user + meals + storage
- Server-only `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Disclaimer: "AI calorie estimates are not medical advice"
- Rate-limit & per-user request caps to control LLM cost

---

## 12. Env Vars

```
# LIFF
NEXT_PUBLIC_LIFF_ID=2009938455-48Gyr7fm
LINE_LOGIN_CHANNEL_ID=2009938455

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# LINE Messaging (push)
LINE_MESSAGING_CHANNEL_ACCESS_TOKEN=...
LINE_MESSAGING_CHANNEL_SECRET=...

# Misc
TZ_DEFAULT=Asia/Bangkok
PUSH_CRON_SECRET=long-random-string  # protects /api/push/daily
```
