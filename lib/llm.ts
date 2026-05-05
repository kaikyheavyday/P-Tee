import crypto from "node:crypto";

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

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
Always return ONLY valid JSON matching the requested schema. Use Thai language for "name" and "items[].name" when input is Thai.`;

// Gemini responseSchema — simplified JSON Schema (no $schema, no additionalProperties)
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          kcal: { type: "INTEGER" },
          portion: { type: "STRING" },
        },
        required: ["name", "kcal", "portion"],
      },
    },
    total_kcal: { type: "INTEGER" },
    confidence: { type: "NUMBER" },
    macros: {
      type: "OBJECT",
      properties: {
        protein_g: { type: "NUMBER" },
        carb_g: { type: "NUMBER" },
        fat_g: { type: "NUMBER" },
      },
      required: ["protein_g", "carb_g", "fat_g"],
    },
  },
  required: ["name", "items", "total_kcal", "confidence", "macros"],
} as const;

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

async function callGemini(parts: GeminiPart[]): Promise<CalorieEstimate> {
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { role: "system", parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`gemini_${res.status}: ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("empty LLM response");
  return JSON.parse(text) as CalorieEstimate;
}

export async function estimateFromText(
  text: string,
  portion?: string,
): Promise<CalorieEstimate> {
  const userMsg = portion
    ? `อาหาร: ${text}\nปริมาณ: ${portion}`
    : `อาหาร: ${text}`;
  return callGemini([{ text: userMsg }]);
}

export async function estimateFromImage(
  dataUrl: string,
  hint?: string,
): Promise<CalorieEstimate> {
  // dataUrl: "data:image/jpeg;base64,...."
  const m = dataUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
  if (!m) throw new Error("invalid_image_data_url");
  const mimeType = m[1];
  const data = m[2];
  const promptText = hint
    ? `รูปอาหาร — เพิ่มเติม: ${hint}\nประเมินแคลอรี่ของอาหารในรูป`
    : "ดูรูปนี้ ประเมินแคลอรี่ของอาหารในรูป";
  return callGemini([{ text: promptText }, { inlineData: { mimeType, data } }]);
}

export function hashKey(parts: string[]): string {
  return crypto.createHash("sha256").update(parts.join("\u0001")).digest("hex");
}
