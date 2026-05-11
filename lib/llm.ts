import crypto from "node:crypto";
import { openai } from "@/lib/openai";

const model = process.env.OPENAI_MODEL || "google/gemini-2.5-flash-preview";

export type CalorieEstimate = {
  is_food: boolean;
  name: string;
  items: Array<{ name: string; kcal: number; portion: string }>;
  total_kcal: number;
  confidence: number;
  macros: { protein_g: number; carb_g: number; fat_g: number };
};

const SYSTEM = `You are a Thai nutritionist. The user describes (or shows a photo of) food, often in Thai.
Estimate calories using realistic Thai street-food / home-cooking portions.
If ambiguous, assume 1 standard serving. If you cannot identify the food,
set confidence < 0.4 and provide a best-guess kcal.
If the input is clearly NOT food (e.g. a selfie, a landscape, random text, non-food objects),
set is_food to false, name to "ไม่ใช่อาหาร", total_kcal to 0, items to [], and confidence to 0.
Always return ONLY valid JSON matching the requested schema. Use Thai language for "name" and "items[].name" when input is Thai.`;

const SCHEMA = {
  name: "CalorieEstimate",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["is_food", "name", "items", "total_kcal", "confidence", "macros"],
    properties: {
      is_food: { type: "boolean" },
      name: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "kcal", "portion"],
          properties: {
            name: { type: "string" },
            kcal: { type: "integer" },
            portion: { type: "string" },
          },
        },
      },
      total_kcal: { type: "integer" },
      confidence: { type: "number" },
      macros: {
        type: "object",
        additionalProperties: false,
        required: ["protein_g", "carb_g", "fat_g"],
        properties: {
          protein_g: { type: "number" },
          carb_g: { type: "number" },
          fat_g: { type: "number" },
        },
      },
    },
  },
} as const;

export async function estimateFromText(
  text: string,
  portion?: string,
): Promise<CalorieEstimate> {
  const userMsg = portion
    ? `อาหาร: ${text}\nปริมาณ: ${portion}`
    : `อาหาร: ${text}`;

  const res = await openai().chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userMsg },
    ],
    response_format: { type: "json_schema", json_schema: SCHEMA },
    temperature: 0.2,
  });

  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error("empty LLM response");
  return JSON.parse(content) as CalorieEstimate;
}

export async function estimateFromImage(
  dataUrl: string,
  hint?: string,
): Promise<CalorieEstimate> {
  const res = await openai().chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: hint
              ? `รูปอาหาร — เพิ่มเติม: ${hint}\nประเมินแคลอรี่ของอาหารในรูป`
              : "ดูรูปนี้ ประเมินแคลอรี่ของอาหารในรูป",
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    response_format: { type: "json_schema", json_schema: SCHEMA },
    temperature: 0.2,
  });

  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error("empty LLM response");
  return JSON.parse(content) as CalorieEstimate;
}

export function hashKey(parts: string[]): string {
  return crypto.createHash("sha256").update(parts.join("\u0001")).digest("hex");
}
