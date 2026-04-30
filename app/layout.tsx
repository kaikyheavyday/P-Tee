import type { Metadata, Viewport } from "next";
import { LiffProvider } from "./providers/LiffProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "P-Tee LIFF",
  description: "LINE LIFF mini app built with Next.js",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#06C755",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LiffProvider>{children}</LiffProvider>
      </body>
    </html>
  );
}
