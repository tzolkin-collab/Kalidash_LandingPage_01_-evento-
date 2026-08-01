import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GoogleTagManager } from '@next/third-parties/google';
import { Inter, Geist, Montserrat } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Imersão Claude para Marketing — Kalidash",
  description:
    "Monte sua própria mini agência de marketing em 8 horas. Imersão presencial em Belo Horizonte, 01 de Agosto.",
  icons: {
    icon: "/kalidash_symbol.svg",
  },
  openGraph: {
    title: "Imersão Claude para Marketing — Kalidash",
    description: "8 horas de pura engenharia operativa. BH, 01/08.",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`h-full antialiased ${inter.variable} font-sans ${geist.variable} ${montserrat.variable} overflow-x-hidden w-full`}>
      {/* Google Tag Manager — filho direto de <html> conforme a doc do
          @next/third-parties. NÃO envolver num <head> manual: no App Router o
          <head> é gerado pelo metadata e envolver o <Script> interno quebra o
          binding no Turbopack (ReferenceError: GoogleTagManager is not defined). */}
      <GoogleTagManager gtmId="GTM-WL5VKKV6" />
      <body className="min-h-full flex flex-col overflow-x-hidden w-full" suppressHydrationWarning>

        {/* Utmify Script */}
        <Script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          strategy="afterInteractive"
          data-utmify-prevent-subdomains
        />

        {/* GA4, Meta Pixel e Clarity são configurados como tags dentro do
            container GTM-WL5VKKV6 (gerenciado pela Carol/Kalidash) — não
            há IDs hardcoded aqui de propósito. Os eventos de conversão dos
            CTAs chegam ao GTM via dataLayer (ver app/utilities/track.ts). */}

        {children}
      </body>
    </html>
  );
}
