import type { LineMessage } from "./line-messaging";

export type MealRecord = {
  name: string;
  kcal: number;
  protein_g: number | null;
  carb_g: number | null;
  fat_g: number | null;
};

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

/** Format YYYY-MM-DD as Thai "D MMMM YYYY" */
function thaiDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Build the "today summary" Flex Message. */
export function buildTodaySummaryFlex(
  meals: MealRecord[],
  isoDate: string,
  dailyKcalTarget?: number | null
): LineMessage {
  const totalKcal = meals.reduce((s, m) => s + (m.kcal ?? 0), 0);
  const totalProtein = round1(meals.reduce((s, m) => s + (m.protein_g ?? 0), 0));
  const totalCarb = round1(meals.reduce((s, m) => s + (m.carb_g ?? 0), 0));
  const totalFat = round1(meals.reduce((s, m) => s + (m.fat_g ?? 0), 0));
  const dateLabel = thaiDateLabel(isoDate);

  const targetLine =
    dailyKcalTarget != null
      ? ` / ${dailyKcalTarget} kcal`
      : "";

  // Food list items (max 10 shown to keep bubble readable)
  const shown = meals.slice(0, 10);
  const foodItems = shown.map((m) => ({
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    paddingTop: "6px",
    paddingBottom: "6px",
    contents: [
      {
        type: "text",
        text: `🍽 ${m.name}`,
        size: "sm",
        color: "#374151",
        flex: 1,
        wrap: true,
      },
      {
        type: "text",
        text: `${m.kcal} kcal`,
        size: "sm",
        weight: "bold",
        color: "#EA580C",
        flex: 0,
        align: "end",
      },
    ],
  }));

  if (meals.length > 10) {
    foodItems.push({
      type: "box",
      layout: "horizontal",
      spacing: "sm",
      paddingTop: "4px",
      paddingBottom: "4px",
      contents: [
        {
          type: "text",
          text: `… และอีก ${meals.length - 10} รายการ`,
          size: "xs",
          color: "#9CA3AF",
          flex: 1,
          wrap: true,
        },
      ],
    });
  }

  return {
    type: "flex",
    altText: `สรุปวันนี้: ${totalKcal} kcal`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "18px",
        backgroundColor: "#16A34A",
        contents: [
          {
            type: "text",
            text: "สรุปวันนี้ 🌿",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: dateLabel,
            size: "sm",
            color: "#BBF7D0",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "16px",
        contents: [
          // Calories summary card
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#FFF7ED",
            cornerRadius: "16px",
            paddingAll: "16px",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "พลังงานรวม",
                size: "sm",
                color: "#9A3412",
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "xs",
                contents: [
                  {
                    type: "text",
                    text: `${totalKcal}`,
                    weight: "bold",
                    size: "4xl",
                    color: "#EA580C",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: `kcal${targetLine}`,
                    size: "sm",
                    color: "#C2410C",
                    flex: 0,
                    margin: "sm",
                  },
                ],
              },
            ],
          },
          // Food list
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#F8FAFC",
            cornerRadius: "16px",
            paddingAll: "14px",
            spacing: "none",
            contents: [
              {
                type: "text",
                text: "รายการอาหารวันนี้",
                size: "sm",
                weight: "bold",
                color: "#475569",
                margin: "none",
              },
              {
                type: "separator",
                margin: "sm",
                color: "#E2E8F0",
              },
              ...foodItems,
            ],
          },
          // Macros
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#F8FAFC",
            cornerRadius: "16px",
            paddingAll: "14px",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "สารอาหารหลัก",
                size: "sm",
                weight: "bold",
                color: "#475569",
              },
              {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#EEF2FF",
                    cornerRadius: "12px",
                    paddingAll: "10px",
                    alignItems: "center",
                    flex: 1,
                    contents: [
                      {
                        type: "text",
                        text: "🥩 Protein",
                        size: "xs",
                        color: "#4F46E5",
                      },
                      {
                        type: "text",
                        text: `${totalProtein}g`,
                        weight: "bold",
                        size: "md",
                        color: "#312E81",
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#ECFEFF",
                    cornerRadius: "12px",
                    paddingAll: "10px",
                    alignItems: "center",
                    flex: 1,
                    contents: [
                      {
                        type: "text",
                        text: "🍚 Carbs",
                        size: "xs",
                        color: "#0891B2",
                      },
                      {
                        type: "text",
                        text: `${totalCarb}g`,
                        weight: "bold",
                        size: "md",
                        color: "#0E7490",
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#FFF7ED",
                    cornerRadius: "12px",
                    paddingAll: "10px",
                    alignItems: "center",
                    flex: 1,
                    contents: [
                      {
                        type: "text",
                        text: "🧈 Fat",
                        size: "xs",
                        color: "#C2410C",
                      },
                      {
                        type: "text",
                        text: `${totalFat}g`,
                        weight: "bold",
                        size: "md",
                        color: "#9A3412",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "14px",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            color: "#22C55E",
            action: {
              type: "uri",
              label: "เพิ่มอาหาร",
              uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/add`,
            },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "ดูทั้งหมด",
              uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/meals`,
            },
          },
        ],
      },
      styles: {
        header: { backgroundColor: "#16A34A" },
        body: { backgroundColor: "#FFFFFF" },
        footer: { backgroundColor: "#FFFFFF", separator: true },
      },
    },
  };
}

/** Build the empty-state Flex Message when no meals are recorded today. */
export function buildEmptySummaryFlex(isoDate: string): LineMessage {
  const dateLabel = thaiDateLabel(isoDate);

  return {
    type: "flex",
    altText: "สรุปวันนี้: ยังไม่มีรายการอาหาร",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "18px",
        backgroundColor: "#16A34A",
        contents: [
          {
            type: "text",
            text: "สรุปวันนี้ 🌿",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: dateLabel,
            size: "sm",
            color: "#BBF7D0",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#F0FDF4",
            cornerRadius: "16px",
            paddingAll: "20px",
            spacing: "sm",
            alignItems: "center",
            contents: [
              {
                type: "text",
                text: "🥗",
                size: "5xl",
                align: "center",
              },
              {
                type: "text",
                text: "ยังไม่มีรายการอาหารวันนี้",
                weight: "bold",
                size: "md",
                color: "#166534",
                align: "center",
              },
              {
                type: "text",
                text: "เริ่มบันทึกมื้ออาหารของคุณ\nพิมพ์ชื่ออาหารที่รับประทานได้เลยนะคะ 😊",
                size: "sm",
                color: "#4B5563",
                align: "center",
                wrap: true,
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "14px",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            color: "#22C55E",
            action: {
              type: "uri",
              label: "เพิ่มอาหาร",
              uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/add`,
            },
          },
        ],
      },
      styles: {
        header: { backgroundColor: "#16A34A" },
        body: { backgroundColor: "#FFFFFF" },
        footer: { backgroundColor: "#FFFFFF", separator: true },
      },
    },
  };
}
