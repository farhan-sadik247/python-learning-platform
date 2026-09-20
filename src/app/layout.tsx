import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Python Learning Platform",
  description:
    "A personal educational platform to learn Python through lessons and programming challenges.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", inter.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-full flex flex-col bg-[#0B1220] text-[#F8FAFC]">
        {children}
      </body>
    </html>
  );
}
