import OpenAI from "openai";
import crypto from "node:crypto";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

let _client: OpenAI | null = null;
export function openai(): OpenAI {
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  if (!_client) _client = new OpenAI({ apiKey });
  return _client;
}

export type CalorieEstimate = {
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
Always return ONLY valid JSON matching the requested schema.`;

const SCHEMA = {
  name: "CalorieEstimate",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["name", "items", "total_kcal", "confidence", "macros"],
    properties: {
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

/** Estimate from a Thai/English text description. */
export async function estimateFromText(
  text: string,
  portion?: string
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

/** Estimate from an image data URL (base64). */
export async function estimateFromImage(
  dataUrl: string,
  hint?: string
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
              ? `รูปอาหาร — เพิ่มเติม: ${hint}`
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
  return crypto
    .createHash("sha256")
    .update(parts.join("\u0001"))
    .digest("hex");
}
