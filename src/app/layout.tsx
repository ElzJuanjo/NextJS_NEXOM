import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  title: "NexOS — Automatización E-commerce con IA",
  description: "Plataforma de automatización y agentes de IA para e-commerce",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f1117",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
