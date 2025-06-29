import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chinese Reading App - Learn Chinese with AI Stories",
  description: "Practice reading Chinese characters with AI-generated stories tailored to your skill level. Features simplified Chinese, Pinyin, and English translations.",
  keywords: "Chinese learning, reading practice, AI stories, Pinyin, vocabulary",
  authors: [{ name: "Chinese Reading App" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
