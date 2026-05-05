import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import { LiffProvider } from "./providers/LiffProvider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "P-Tee · Calorie Tracker",
  description: "ติดตามแคลอรี่รายวันบน LINE",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFA840",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={kanit.variable}>
      <body>
        <LiffProvider>
          {children}
        </LiffProvider>
        <Toaster />
      </body>
    </html>
  );
}
