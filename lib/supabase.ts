import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // Don't throw at import time during build; throw on actual use.
}

export function supabaseAdmin() {
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type DbUser = {
  line_user_id: string;
  display_name: string | null;
  picture_url: string | null;
  gender: "male" | "female" | null;
  birthdate: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity:
    | "sedentary"
    | "light"
    | "moderate"
    | "active"
    | "very_active"
    | null;
  goal: "lose" | "maintain" | "gain" | null;
  daily_kcal_target: number | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
};

export type DbMeal = {
  id: string;
  line_user_id: string;
  eaten_at: string;
  local_date: string;
  input_text: string | null;
  image_url: string | null;
  name: string;
  kcal: number;
  protein_g: number | null;
  carb_g: number | null;
  fat_g: number | null;
  ai_raw: unknown;
  ai_confidence: number | null;
  edited_by_user: boolean;
  created_at: string;
};
