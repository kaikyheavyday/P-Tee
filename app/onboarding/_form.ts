export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";
export type Gender = "male" | "female";

export type OnboardingForm = {
  gender: Gender | "";
  birthdate: string;
  height_cm: string;
  weight_kg: string;
  activity: Activity | "";
  goal: Goal | "";
  target_weight_kg: string;
};

export const initialForm: OnboardingForm = {
  gender: "",
  birthdate: "",
  height_cm: "",
  weight_kg: "",
  activity: "",
  goal: "",
  target_weight_kg: "",
};
